const Review = require('../../models/review');
const { sendResponse } = require('../../utils/helpers/helper');
const { httpError } = require('../../utils/helpers/error');

const getReviewOfSingleProduct = async (req, res, next) => {
  try {
    let { productId } = req?.params;
    let { skip = 0, limit = 50 } = req?.query;
    if (!productId) throw new httpError(null, 400, {}, 'Insufficient Data');
    // todo - add one extra field in each review as to how many comments are under it
    let reviews = await Review.find({ product: productId }).skip(skip).limit(limit).exec();
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
    let comments = await Review.find({ productId, parent: reviewId }).skip(skip).limit(limit).exec().lean();
    if (!comments) throw new httpError(null, 404, {}, 'Not Found!');
    sendResponse(res, 200, comments, 'Success!');
  } catch (err) {
    err.scope = err.scope || 'getCommentsOnReview';
    next({ err });
  }
};

module.exports = {
  getReviewOfSingleProduct,
  getCommentsOnReview,
};
