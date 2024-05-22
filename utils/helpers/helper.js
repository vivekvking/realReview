const Axios = require('axios');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { httpError } = require('./error');
const { JWT_ACCESS_HASH_KEY } = require('../constants/envConstants');

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
    jwt.verify(token, JWT_ACCESS_HASH_KEY, (err, decoded) => {
      if (err) {
        throw new httpError(null, 401, {}, 'Invalid Token');
      }
      if (!req.body) req.body = {};
      req.body.username = decoded.username;
      req.body.userId = decoded.userId;
      next();
    });
  } catch (err) {
    err.scope = err.scope || 'authentication';
    next(err);
  }
};

module.exports = {
  sendResponse,
  isAuthenticated,
};
