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
    categoryId: {
      type: Mongoose.Types.ObjectId,
      ref: 'category',
    },
    isDeleted: {
      type: Boolean,
    },
    totalRating: {
      type: Object,
    },
    averageRating: {
      type: Number,
    },
    totalReviews: {
      type: Number,
    },
    totalReplies: {
      type: Number,
    },
    aiGeneratedReview: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Set toJSON option to include virtuals
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Pre-save middleware to sync category with categoryId
ProductSchema.pre('save', function(next) {
  if (this.category && !this.categoryId) {
    this.categoryId = this.category;
  } else if (this.categoryId && !this.category) {
    this.category = this.categoryId;
  }
  next();
});

const Product = mongooseConn.model('product', ProductSchema, 'product');

module.exports = Product;
