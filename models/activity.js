const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

const ActivitySchema = Schema(
  {
    user: {
      type: Mongoose.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    product: {
      type: Mongoose.Types.ObjectId,
      ref: 'product',
    },
    review: {
      type: Mongoose.Types.ObjectId,
      ref: 'review',
    },
    activity: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

ActivitySchema.index({ user: 1 });

const Activity = mongooseConn.model('activity', ActivitySchema, 'activity');

module.exports = Activity;
