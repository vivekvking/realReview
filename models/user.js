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
    //? single-use, cleared on verification. The old flow verified by username
    //? in the URL, so anyone could mark any account verified by guessing it.
    verificationToken: {
      type: String,
    },
    //? tokens are deliberately NOT persisted - they are signed JWTs, so storing
    //? them hands live sessions to anyone who reads the collection, and writing
    //? them on every login capped each user at a single active device
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

// UserSchema.index({ email: 1 });
// UserSchema.index({ username: 1 });

const User = mongooseConn.model('user', UserSchema, 'user');

module.exports = User;
