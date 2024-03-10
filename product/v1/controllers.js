const Product = require('../../models/product');
const { sendResponse } = require('../../utils/helpers/helper');

const getAllProducts = async (req, res, next) => {
  try {
    // todo - add a searching algorithm in this
    const { skip = 0, limit = 20 } = req.query;
    const products = await Product.find({}).skip().limit().exec();
    return sendResponse(res, 200, products, 'success!');
  } catch (err) {
    err.scope = 'getAllProducts';
    next(err);
  }
};

const getSingleProduct = async (req, res, next) => {
  try {
    let { id } = req.params;
    let status = 200,
      message = 'success!';
    const product = await Product.findOne({ _id: id });
    if (!product) {
      throw new httpError(null, 404, {}, 'Product not found', { id });
    }
    return sendResponse(res, status, product, message);
  } catch (err) {
    err.scope = 'getSingleProduct';
    next(err);
  }
};

const addProduct = async (req, res, next) => {
  let {
    
  } = req?.body;
}

const deleteProduct = async (req, res, next) => {
  let { id } = req.query;
  if (!id) throw new httpError(null, 400, {}, 'Insufficient Data');
  const product = await Product.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        isDeleted: true,
      },
    },
    { new: true },
  );
  if (!product) throw new httpError(null, 404, {}, 'Product not found', { id });
  return sendResponse(res, 200, {}, "Product deleted successfully!")
};

module.exports = {
  getAllProducts,
  getSingleProduct,
};
