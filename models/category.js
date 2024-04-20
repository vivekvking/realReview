const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const { DB } = require('../utils/connectors/mongo');
const mongooseConn = DB.MONGOOSE_CONN_OBJECT;

const CategorySchema = Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  },
);

const Category = mongooseConn.model('category', CategorySchema, 'category');

module.exports = Category;
