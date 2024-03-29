const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

const ProductSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    images: {
      type: Array,
    },
    videos: {
      type: Array,
    },
    createdBy: {
      type: Mongoose.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    category: {
      type: Mongoose.Types.ObjectId,
      ref: 'category',
    },
    isDeleted: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongooseConn.model('product', ProductSchema, 'product');

module.exports = Product;
