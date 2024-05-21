const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const { handleAppError } = require('./error');
const { SERVICE_ACCOUNT_CREDENTIALS } = require('../constants/envConstants');
let connOpt = SERVICE_ACCOUNT_CREDENTIALS ? { credentials: JSON.parse(SERVICE_ACCOUNT_CREDENTIALS) } : {};
const storage = new Storage(connOpt);

/**
 *
 * @param {String} bucketName
 * @param {String} key | location
 * @param {Buffer} data | buffer data
 * @param {String} mimetype
 * @returns
 */
const uploadFileToGCP = async (bucketName, key, data, mimetype) => {
  return new Promise(async (resolve, reject) => {
    try {
      let file = storage.bucket(bucketName).file(key);
      let stream = file.createWriteStream({
        metadata: {
          contentType: mimetype,
        },
        predefinedAcl: 'publicRead',
      });

      stream.on('error', (err) => {
        throw err;
      });

      stream.on('finish', () => {
        let public_url = `https://storage.googleapis.com/${bucketName}/${key}`;
        resolve(public_url);
      });

      stream.end(data);
    } catch (err) {
      err.scope = err.scope || 'uploadFileToGCP';
      handleAppError({ err });
      reject(err);
    }
  });
};

module.exports = {
  uploadFileToGCP,
};
