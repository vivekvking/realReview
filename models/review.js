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
    productId: {
      type: Mongoose.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    parentId: {
      type: Mongoose.Types.ObjectId,
      ref: 'review',
    },
    reviewId: {
      type: Mongoose.Types.ObjectId,
      ref: 'review',
    },
    images: {
      type: Array,
    },
    videos: {
      type: Array,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Mongoose.Types.ObjectId,
      ref: 'user',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

ReviewSchema.pre('save', function(next) {
  if (this.parentId && !this.reviewId) {
    this.reviewId = this.parentId;
  } else if (this.reviewId && !this.parentId) {
    this.parentId = this.reviewId;
  }
  next();
});

ReviewSchema.index({ productId: 1, parentId: 1 });
const Review = mongooseConn.model('review', ReviewSchema, 'review');

module.exports = Review;
