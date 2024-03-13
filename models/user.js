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
    },
    referalId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongooseConn.model('user', UserSchema, 'user');

module.exports = User;
