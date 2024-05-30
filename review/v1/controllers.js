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

const getCommentsOnReview = async (req, res, next) => {
  try {
    let { productId, reviewId } = req.params;
    let { skip = 0, limit = 10 } = req.query;
    let comments = await Review.find({ productId, parentId: reviewId }).skip(skip).limit(limit).populate('userId', 'username profilePic').lean().exec();
    sendResponse(res, 200, comments, 'Success!');
  } catch (err) {
    err.scope = err.scope || 'getCommentsOnReview';
    next(err);
  }
};

const addReview = async (req, res, next) => {
  try {
    let { productId, comment, rating, images, videos, reviewId, username, userId } = req.body;
    let review;
    let product = await Product.find({ _id: productId });
    if (!product) throw new httpError(null, 404, {}, 'Product not found!');
    if (reviewId) {
      const parentReview = await Review.findOne({ _id: reviewId });
      if (!parentReview) throw new httpError(null, 404, {}, 'Review not found!');
      review = await Review.create({ comment, productId, images, videos, userId, parentId: reviewId });
      parentReview.replyCount++;
      parentReview.save();
      product.totalReplies = product.totalReplies + 1;
      product.save();
    } else {
      review = await Review.create({ comment, rating, productId, images, videos, userId });

      // todo - update the average rating counting process when site visitors increase
      let totalRating = product.totalRating + rating;
      let totalReviews = product.totalReviews + 1;
      let averageRating = (totalRating / totalReviews).toFixed(2);
      product.totalRating = totalRating;
      product.totalReviews = totalReviews;
      product.averageRating = averageRating;
      product.save();
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
    // todo - if some other user try to edit the comment then it won't edit it as it won't find that document
    // todo - change the api response accordingly
    return sendResponse(res, 200, review, 'success!');
  } catch (err) {
    err.scope = err.scope || 'editReview';
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    let { username, userId, reviewId } = req?.body;
    await Review.deleteOne({ _id: reviewId, userId })
      .then(() => {
        return sendResponse(res, 200, {}, 'Deleted Successfully');
      })
      .catch((err) => {
        return sendResponse(res, 409, {}, 'You cannot delete this review');
      });
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
};
