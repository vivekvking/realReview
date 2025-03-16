const Review = require('../../models/review');
const { sendResponse } = require('../../utils/helpers/helper');
const { httpError } = require('../../utils/helpers/error');
const Product = require('../../models/product');

const getReviewOfSingleProduct = async (req, res, next) => {
  try {
    let { productId } = req?.params;
    let { skip = 0, limit = 20 } = req?.query;
    if (!productId) throw new httpError(null, 400, {}, 'Product id missing');
    let reviews = await Review.find({ productId: productId, parentId: { $exists: false } })
      .skip(skip)
      .limit(limit)
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
    let { productId, comment, rating, images, videos, reviewId, username, userId } = req.body;
    let review;
    let product = await Product.findOne({ _id: productId });
    if (!product) throw new httpError(null, 404, {}, 'Product not found!');
    if (reviewId) {
      const parentReview = await Review.findOne({ _id: reviewId });
      if (!parentReview) throw new httpError(null, 404, {}, 'Review not found!');
      review = await Review.create({ comment, productId, images, videos, userId, parentId: reviewId });
      parentReview.replyCount = (parentReview.replyCount || 0) + 1;
      await parentReview.save();
      product.totalReplies = (product?.totalReplies ?? 0) + 1;
      await product.save();
    } else {
      review = await Review.create({ comment, rating, productId, images, videos, userId });

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
    let { reviewId } = req?.body;
    let review = await Review.findOne({ _id: reviewId });
    if (!review) throw new httpError(null, 404, {}, 'Review not found!');
    
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

module.exports = {
  getReviewOfSingleProduct,
  getCommentsOnReview,
  addReview,
  deleteReview,
  editReview,
  getRatingDistribution
};
