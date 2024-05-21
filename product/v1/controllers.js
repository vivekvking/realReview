const Product = require('../../models/product');
const { sendResponse } = require('../../utils/helpers/helper');
const { httpError } = require('../../utils/helpers/error');
const Category = require('../../models/category');
const User = require('../../models/user');
const { PUBLIC_BUCKET_NAME } = require('../../utils/constants/envConstants');
const { uploadFileToGCP } = require('../../utils/helpers/gcphelper');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

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
    let { title, description, images, videos, categoryId, username, userId } = req?.body;
    if (!title) throw new httpError(null, 400, {}, 'Insufficient Data');
    if ((images && !Array.isArray(images)) || (videos && !Array.isArray(videos))) {
      throw new httpError(null, 400, {}, 'Bad Request');
    }
    let product = await Product.create({
      title,
      description,
      images,
      videos,
      createdBy: userId,
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
    let { id } = req?.params;
    if (!id || !title) throw new httpError(null, 400, {}, 'Insufficient Data');
    if ((images && !Array.isArray(images)) || (videos && !Array.isArray(videos))) {
      throw new httpError(null, 400, {}, 'Bad Request');
    }

    // todo - add checks as to who all can edit this

    let product = await Product.findOneAndUpdate(
      { _id: id },
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
    return sendResponse(res, 200, product, 'success!');
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

const createCategory = async (req, res, next) => {
  try {
    // todo - don't allow normal users to create category or if it is created then it has to be verified by admin
    let { title, description } = req.body;
    if (!title) throw new httpError(null, 400, {}, 'Insufficient Data');

    // todo - check if the category already exists

    const category = await Category.create({ title, description });
    return sendResponse(res, 200, category, 'success!');
  } catch (err) {
    err.scope = err.scope || 'createCategory';
    next(err);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().lean().exec();
    return sendResponse(res, 200, categories, 'success!');
  } catch (err) {
    err.scope = err.scope || 'listCategories';
    next(err);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new httpError(null, 400, {}, 'Insufficient Data');
    let bufferData = req.file?.buffer;
    let date = moment().format('YYYY-MM-DD');
    let destination = `products/${date}/${uuidv4()}_${req.file?.originalname.replaceAll(' ', '_')}`;
    let mimetype = req.file?.mimetype;
    const bucketName = PUBLIC_BUCKET_NAME;

    let public_url = await uploadFileToGCP(bucketName, destination, bufferData, mimetype);
    return sendResponse(res, 200, { public_url }, 'success!');
  } catch (err) {
    err.scope = err.scope || 'uploadFile';
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getSingleProduct,
  addProduct,
  deleteProduct,
  editProduct,
  createCategory,
  listCategories,
  uploadFile,
};
