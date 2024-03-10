const Axios = require('axios');
const _ = require('lodash')

const sendResponse = (res, statusCode, data = {}, message = '') => {
  try {
    const lengthPattern = /^$[0-9]{3}$/; // regex pattern to validate the status code is always 3 digit length
    if (typeof statusCode !== 'number') throw new Error('statusCode should be a number');
    if (!lengthPattern.test(statusCode)) throw new Error('Invalid Status Code');

    res.status(statusCode).json({
      data,
      message,
    });

    return res;
  } catch (err) {
    res.status(500).json({ data: {}, message: 'Error while sending response!' });
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

module.exports = {
  sendResponse,
};
