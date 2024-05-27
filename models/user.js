const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

const UserSchema = Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    salt: {
      type: String,
    },
    referralId: {
      type: String,
    },
    profilePic: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

const User = mongooseConn.model('user', UserSchema, 'user');

module.exports = User;
