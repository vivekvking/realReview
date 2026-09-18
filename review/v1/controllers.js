const Review = require('../../models/review');
const { sendResponse } = require('../../utils/helpers/helper');
const { httpError } = require('../../utils/helpers/error');
const Product = require('../../models/product');

const getReviewOfSingleProduct = async (req, res, next) => {
  try {
    let { productId } = req?.params;
    let { skip = 0, limit = 20 } = req?.query;
    if (!productId) throw new httpError(null, 400, {}, 'Product id missing');
    let reviews = await Review.find({
      productId: productId,
      parentId: { $exists: false },
      status: { $ne: 'removed' },
    })
      //? verified purchases first, then newest - an unverified review still
      //? shows, it just doesn't get to sit at the top of the page
      .sort({ isVerifiedPurchase: -1, createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'username profilePic')
      .lean()
      .exec();
    sendResponse(res, 200, reviews, 'Success!');
  } catch (err) {
    err.scope = err.scope || 'getReviewOfSingleProduct';
    next(err);
  }
};

// Get rating distribution for a product
const getRatingDistribution = async (req, res, next) => {
  try {
    let { productId } = req?.params;
    if (!productId) throw new httpError(null, 400, {}, 'Product id missing');
    
    const product = await Product.findOne({ _id: productId }, 'ratingDistribution totalReviews averageRating');
    if (!product) throw new httpError(null, 404, {}, 'Product not found!');
    
    sendResponse(res, 200, {
      ratingDistribution: product.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalReviews: product.totalReviews || 0,
      averageRating: product.averageRating || 0
    }, 'Success!');
  } catch (err) {
    err.scope = err.scope || 'getRatingDistribution';
    next(err);
  }
};

const getCommentsOnReview = async (req, res, next) => {
  try {
    let { productId, reviewId } = req.params;
    let { skip = 0, limit = 10 } = req.query;
    
    // Get total count of comments for this review
    const totalCount = await Review.countDocuments({ productId, parentId: reviewId });
    
    // Get paginated comments
    let comments = await Review.find({ productId, parentId: reviewId })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'username profilePic')
      .lean()
      .exec();
    
    // Send response with comments and total count
    sendResponse(res, 200, { data: comments, totalCount }, 'Success!');
  } catch (err) {
    err.scope = err.scope || 'getCommentsOnReview';
    next(err);
  }
};

const addReview = async (req, res, next) => {
  try {
    let { productId, comment, rating, images, videos, reviewId, username, userId, proofUrl, orderDate } = req.body;
    let review;
    let product = await Product.findOne({ _id: productId });
    if (!product) throw new httpError(null, 404, {}, 'Product not found!');
    if (reviewId) {
      const parentReview = await Review.findOne({ _id: reviewId });
      if (!parentReview) throw new httpError(null, 404, {}, 'Review not found!');
      //? a claimed owner replying on their own page is badged as the seller
      const isSellerReply = product.isClaimed && product.claimedBy?.toString() === userId?.toString();
      review = await Review.create({ comment, productId, images, videos, userId, parentId: reviewId, isSellerReply });
      parentReview.replyCount = (parentReview.replyCount || 0) + 1;
      await parentReview.save();
      product.totalReplies = (product?.totalReplies ?? 0) + 1;
      await product.save();
    } else {
      if (!rating || rating < 1 || rating > 5) throw new httpError(null, 400, {}, 'A review needs a rating between 1 and 5');

      //? attaching an order screenshot / receipt is what earns the badge. The
      //? file itself is reviewable later if the rating is ever disputed.
      review = await Review.create({
        comment,
        rating,
        productId,
        images,
        videos,
        userId,
        proofUrl,
        orderDate,
        isVerifiedPurchase: Boolean(proofUrl),
      });

      // Initialize rating distribution if it doesn't exist
      if (!product.ratingDistribution) {
        product.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      }
      
      // Increment the count for this rating
      const ratingKey = Math.floor(rating);
      product.ratingDistribution[ratingKey] = (product.ratingDistribution[ratingKey] || 0) + 1;

      // Update average rating
      let totalRating = (product?.totalRating ?? 0) + rating;
      let totalReviews = (product?.totalReviews ?? 0) + 1;
      let averageRating = (totalRating / totalReviews).toFixed(2);
      product.totalRating = totalRating;
      product.totalReviews = totalReviews;
      product.averageRating = averageRating;
      await product.save();
    }
    return sendResponse(res, 200, review, 'success!');
  } catch (err) {
    err.scope = err.scope || 'addReveiw';
    next(err);
  }
};

const editReview = async (req, res, next) => {
  try {
    let { productId, comment, rating, images, videos, username, userId, reviewId } = req?.body;
    
    // Get the original review to check if rating changed
    const originalReview = await Review.findOne({ _id: reviewId, userId });
    if (!originalReview) {
      return sendResponse(res, 404, null, 'Review not found or you do not have permission to edit it');
    }
    
    // Update the review
    let review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      {
        $set: {
          comment,
          rating,
          images,
          videos,
        },
      },
      { new: true },
    );
    
    // If rating changed, update the product's rating distribution
    if (originalReview.rating !== rating && productId) {
      const product = await Product.findOne({ _id: productId });
      if (product && product.ratingDistribution) {
        // Decrement the old rating count
        const oldRatingKey = Math.floor(originalReview.rating);
        if (product.ratingDistribution[oldRatingKey] > 0) {
          product.ratingDistribution[oldRatingKey] -= 1;
        }
        
        // Increment the new rating count
        const newRatingKey = Math.floor(rating);
        product.ratingDistribution[newRatingKey] = (product.ratingDistribution[newRatingKey] || 0) + 1;
        
        // Recalculate average rating
        const totalReviews = product.totalReviews || 0;
        if (totalReviews > 0) {
          const totalRating = (product.totalRating || 0) - originalReview.rating + rating;
          product.totalRating = totalRating;
          product.averageRating = (totalRating / totalReviews).toFixed(2);
          await product.save();
        }
      }
    }
    
    return sendResponse(res, 200, review, 'success!');
  } catch (err) {
    err.scope = err.scope || 'editReview';
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    let { reviewId, userId } = req?.body;
    let review = await Review.findOne({ _id: reviewId });
    if (!review) throw new httpError(null, 404, {}, 'Review not found!');

    //? without this any logged-in account could delete anybody's review, which
    //? is the one thing this product promises cannot happen
    if (review.userId?.toString() !== userId?.toString()) {
      throw new httpError(null, 403, {}, 'You can only delete your own review');
    }
    
    // If this is a top-level review with a rating, update the product's rating distribution
    if (!review.parentId && review.rating) {
      const product = await Product.findOne({ _id: review.productId });
      if (product) {
        // Decrement the rating count
        const ratingKey = Math.floor(review.rating);
        if (product.ratingDistribution && product.ratingDistribution[ratingKey] > 0) {
          product.ratingDistribution[ratingKey] -= 1;
        }
        
        // Recalculate average rating
        const totalReviews = (product.totalReviews || 1) - 1;
        product.totalReviews = totalReviews;
        
        if (totalReviews > 0) {
          const totalRating = (product.totalRating || review.rating) - review.rating;
          product.totalRating = totalRating;
          product.averageRating = (totalRating / totalReviews).toFixed(2);
        } else {
          product.totalRating = 0;
          product.averageRating = 0;
        }
        
        await product.save();
      }
    }
    
    // If this is a reply, decrement the parent's reply count
    if (review.parentId) {
      const parentReview = await Review.findOne({ _id: review.parentId });
      if (parentReview && parentReview.replyCount > 0) {
        parentReview.replyCount -= 1;
        await parentReview.save();
      }
      
      // Also decrement the product's total replies
      const product = await Product.findOne({ _id: review.productId });
      if (product && product.totalReplies > 0) {
        product.totalReplies -= 1;
        await product.save();
      }
    }
    
    await Review.deleteOne({ _id: reviewId });
    return sendResponse(res, 200, {}, 'Deleted successfully');
  } catch (err) {
    err.scope = err.scope || 'deleteReview';
    next(err);
  }
};

//? the takedown path. A seller who thinks a review is false flags it here
//? instead of it being silently unanswerable - reports are queued for
//? moderation rather than auto-removing, so one angry seller can't erase
//? criticism, and we keep an audit trail if a claim is ever escalated.
const REPORT_REASONS = ['false_information', 'spam', 'abusive', 'not_my_business', 'personal_data', 'other'];
const REPORT_THRESHOLD = 3;

const reportReview = async (req, res, next) => {
  try {
    let { reviewId, reason, details } = req?.body;
    if (!reviewId || !reason) throw new httpError(null, 400, {}, 'Insufficient Data');
    if (!REPORT_REASONS.includes(reason)) throw new httpError(null, 400, {}, 'Unknown report reason');

    const review = await Review.findOne({ _id: reviewId });
    if (!review) throw new httpError(null, 404, {}, 'Review not found!');

    review.reportCount = (review.reportCount || 0) + 1;
    //? enough independent reports hides it pending a human look, but it is
    //? never hard-deleted - status moves, the row stays
    if (review.reportCount >= REPORT_THRESHOLD && review.status === 'published') {
      review.status = 'under_review';
    }
    await review.save();

    console.log(`[moderation] review ${reviewId} reported as ${reason}: ${details || 'no details'} (count ${review.reportCount})`);
    return sendResponse(res, 200, { status: review.status }, 'success!');
  } catch (err) {
    err.scope = err.scope || 'reportReview';
    next(err);
  }
};

module.exports = {
  getReviewOfSingleProduct,
  getCommentsOnReview,
  reportReview,
  addReview,
  deleteReview,
  editReview,
  getRatingDistribution
};
