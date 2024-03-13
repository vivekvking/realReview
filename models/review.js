const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

const ReviewSchema = Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
    },
    product: {
      type: Mongoose.Types.ObjectId,
      ref: 'product',
    },
    parent: {
      type: Mongoose.Types.ObjectId,
      ref: 'review',
    },
    images: {
      type: Array,
    },
    videos: {
      type: Array,
    },
  },
  {
    timestamps: true,
  },
);

const Review = mongooseConn.model('review', ReviewSchema, 'review');

module.exports = Review;
