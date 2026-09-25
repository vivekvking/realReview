const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

//? what kind of thing is being reviewed. Launch only exposes social_seller -
//? the rest are switched on later without a migration.
const ENTITY_TYPES = ['social_seller', 'product', 'service', 'website'];
const PLATFORMS = ['instagram', 'whatsapp', 'facebook', 'youtube', 'x', 'website', 'other'];

const ProductSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      default: 'social_seller',
    },
    platform: {
      type: String,
      enum: PLATFORMS,
    },
    //? normalised - lowercase, no leading @. Paired with platform this is the
    //? real primary key: one @handle can only ever be one page, which is what
    //? stops the catalog forking into duplicates the way a product name would.
    handle: {
      type: String,
      trim: true,
    },
    profileUrl: {
      type: String,
    },
    //? set once a seller proves they own the handle, so their replies can be
    //? badged differently from anonymous ones
    isClaimed: {
      type: Boolean,
      default: false,
    },
    claimedBy: {
      type: Mongoose.Types.ObjectId,
      ref: 'user',
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
    //? review count the current summary was built from - the nightly job skips
    //? any product whose reviews have not moved since, so cost tracks new
    //? activity instead of total catalog size
    aiGeneratedReviewCount: {
      type: Number,
    },
    ratingDistribution: {
      type: Object,
      default: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
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
  if (this.handle) this.handle = normaliseHandle(this.handle);
  next();
});

//? one page per handle per platform, forever. sparse so the product/service
//? entity types (which have no handle) don't all collide on null.
ProductSchema.index(
  { platform: 1, handle: 1 },
  { unique: true, sparse: true, partialFilterExpression: { handle: { $type: 'string' } } },
);
ProductSchema.index({ entityType: 1 });

const normaliseHandle = (raw = '') =>
  String(raw)
    .trim()
    .replace(/^@+/, '')
    .replace(/\/+$/, '')
    .toLowerCase();

const Product = mongooseConn.model('product', ProductSchema, 'product');

module.exports = Product;
module.exports.ENTITY_TYPES = ENTITY_TYPES;
module.exports.PLATFORMS = PLATFORMS;
module.exports.normaliseHandle = normaliseHandle;
