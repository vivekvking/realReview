const Product = require('../../models/product');
const { sendResponse } = require('../../utils/helpers/helper');
const { httpError } = require('../../utils/helpers/error');

const getAllProducts = async (req, res, next) => {
  try {
    // todo - add a searching algorithm in this
    const { skip = 0, limit = 20, search } = req.query;
    let query = {};
    if (search) query['title'] = { $regex: search, $options: 'i' };
    const products = await Product.find(query).skip(skip).limit(limit).exec();
    return sendResponse(res, 200, products, 'success!');
  } catch (err) {
    err.scope = 'getAllProducts';
    next(err);
  }
};

const getSingleProduct = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) throw new httpError(null, 400, {}, 'Insufficient Data');
    const product = await Product.findOne({ _id: id });
    if (!product) throw new httpError(null, 404, {}, 'Product not found', { id });
    return sendResponse(res, 200, product, 'success!');
  } catch (err) {
    err.scope = 'getSingleProduct';
    next(err);
  }
};

const addProduct = async (req, res, next) => {
  try {
    let { title, description, images, videos, userId, categoryId } = req?.body;
    if (!title || !userId) throw new httpError(null, 400, {}, 'Insufficient Data');
    if ((images && !Array.isArray(images)) || (videos && !Array.isArray(videos))) {
      throw new httpError(null, 400, {}, 'Bad Request');
    }
    let product = await Product.create({
      title,
      description,
      images,
      videos,
      userId,
      categoryId,
    });
    sendResponse(res, 200, product, 'success!');
  } catch (err) {
    err.scope = err.scope || 'addProduct';
    next(err);
  }
};

const editProduct = async (req, res, next) => {
  try {
    let { title, description, images, videos, categoryId } = req?.body;
    let { productId } = req?.params;
    if (!productId || !title) throw new httpError(null, 400, {}, 'Insufficient Data');
    if ((images && !Array.isArray(images)) || (videos && !Array.isArray(videos))) {
      throw new httpError(null, 400, {}, 'Bad Request');
    }
    let product = await Product.findOneAndUpdate(
      { _id: productId },
      {
        $set: {
          title,
          description,
          images,
          videos,
          categoryId,
        },
      },
      {
        new: true,
      },
    );
  } catch (err) {
    err.scope = err.scope || 'editProduct';
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    let { id } = req.params;
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
    return sendResponse(res, 200, {}, 'Product deleted successfully!');
  } catch (err) {
    err.scope = err.scope || 'deleteProduct';
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getSingleProduct,
  addProduct,
  deleteProduct,
  editProduct,
};
