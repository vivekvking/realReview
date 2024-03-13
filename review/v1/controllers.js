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


module.exports = {
  getReviewOfSingleProduct
}
