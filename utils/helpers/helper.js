const Axios = require('axios');
const _ = require('lodash');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { httpError, handleAppError } = require('./error');
const { JWT_ACCESS_HASH_KEY } = require('../constants/envConstants');
const { generateAIReview } = require('../utility');
const Product = require('../../models/product');

const sendResponse = (res, statusCode, data = {}, message = '') => {
  try {
    const lengthPattern = /^[0-9]{3}$/; // regex pattern to validate the status code is always 3 digit length
    if (typeof statusCode !== 'number') throw new Error('statusCode should be a number');
    if (!lengthPattern.test(statusCode)) throw new Error('Invalid Status Code');

    res.status(statusCode).json({
      data,
      message,
    });

    return res;
  } catch (err) {
    res.status(500).json({ data: {}, message: 'Error while sending response!' });
    console.log(err);
  }
};

const getResponseSync = async ({ options }) => {
  try {
    options.timeout = options.timeout || 10000;
    let response = await Axios({ options });
    if (response && response.data) {
      return response;
    }
  } catch (err) {
    let metadata = { url: options.url, method: options.method };
    err.scope = 'getResponseSync';
    err.metadata = _.merge({}, err.metadata, metadata);
    throw err;
  }
};

const isAuthenticated = async (req, res, next) => {
  try {
    let { authorization } = req?.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new httpError(null, 400, {}, 'Authorization header missing or invalid');
    }
    let token = authorization.split(' ')[1];

    //? verify synchronously - throwing from the callback form escapes this
    //? try/catch and takes the process down instead of returning a 401
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_HASH_KEY);
    } catch (err) {
      throw new httpError(null, 401, {}, 'Invalid Token');
    }

    // Set user info directly on the request object
    req.username = decoded.username;
    req.userId = decoded.userId;

    // Also set in body for backward compatibility
    if (!req.body) req.body = {};
    req.body.username = decoded.username;
    req.body.userId = decoded.userId;

    next();
  } catch (err) {
    err.scope = err.scope || 'isAuthenticated';
    next(err);
  }
};

//? AI review scheduler
cron.schedule('0 0 * * * ', () => {
  console.log('Job triggered');
  aiReviewScheduler();
});

const aiReviewScheduler = async () => {
  try {
    console.log('AI REVIEW SCHEDULER TRIGGERED ..................................................');

    //? only resummarize products whose review count has actually changed - the
    //? previous version sent every product in the DB to GPT-4o every night
    const products = await Product.find({
      isDeleted: { $ne: true },
      totalReviews: { $gt: 0 },
      $expr: { $ne: ['$totalReviews', '$aiGeneratedReviewCount'] },
    })
      .select('_id')
      .lean();

    console.log(`AI REVIEW SCHEDULER - ${products.length} product(s) need a refreshed summary`);
    for (let product of products) await generateAIReview(product._id);
    console.log('AI REVIEW CREATION COMPLETED ....................................................');
  } catch (err) {
    err.scope = err.scope || 'aiReviewScheduler';
    handleAppError({ err });
  }
};

module.exports = {
  sendResponse,
  isAuthenticated,
};
