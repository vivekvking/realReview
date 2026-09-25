const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

//? fixed vocabulary, deliberately small. Free-form tags would fragment
//? instantly ("didnt arrive" / "never came" / "no delivery") and stop
//? aggregating, which is the entire reason they exist.
const REVIEW_TAGS = [
  // positive
  'as_described',
  'fast_shipping',
  'good_communication',
  'well_packaged',
  'fair_price',
  'would_buy_again',
  // negative
  'not_as_described',
  'late_delivery',
  'never_arrived',
  'no_response',
  'fake_product',
  'refused_refund',
  'blocked_me',
  'arrived_damaged',
];

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
    //? proof-of-purchase. An order screenshot / UPI receipt earns the "Verified
    //? purchase" badge - this is the anti-astroturf mechanism, so unverified
    //? reviews still show but rank lower and read weaker.
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    proofUrl: {
      type: String,
    },
    orderDate: {
      type: Date,
    },
    //? a claimed seller answering a review about them - right of reply, which is
    //? both fair and a large part of staying an intermediary rather than a
    //? publisher if this is ever challenged legally
    isSellerReply: {
      type: Boolean,
      default: false,
    },
    //? takedown workflow. Reviews are never hard-deleted by moderation, they
    //? move to under_review / removed so there is an audit trail.
    status: {
      type: String,
      enum: ['published', 'under_review', 'removed'],
      default: 'published',
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    //? set only on top-level reviews, left unset on replies. Exists purely so
    //? the one-review-per-user index below can be a partial index - Mongo's
    //? partialFilterExpression does not accept { $exists: false }.
    isTopLevel: {
      type: Boolean,
    },
    //? structured "what happened" tags picked from a fixed list. Most people
    //? will not write paragraphs, so these carry the signal a free-text box
    //? would otherwise lose - and they aggregate, which prose never will
    //? ("6 people said they were blocked after paying" beats six essays).
    tags: {
      type: [String],
      enum: REVIEW_TAGS,
      default: undefined,
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
  this.isTopLevel = this.parentId ? undefined : true;
  next();
});

ReviewSchema.index({ productId: 1, parentId: 1 });

//? One review per person per seller. Without this, one user with three
//? accounts can set any seller's rating to whatever they want, which makes
//? every number on the site meaningless. Replies are unaffected.
ReviewSchema.index(
  { productId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { isTopLevel: true } },
);
const Review = mongooseConn.model('review', ReviewSchema, 'review');

module.exports = Review;
module.exports.REVIEW_TAGS = REVIEW_TAGS;
