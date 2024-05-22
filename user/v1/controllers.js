const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { httpError } = require('../../utils/helpers/error');
const { sendResponse } = require('../../utils/helpers/helper');
const { SALT_ENV, JWT_ACCESS_HASH_KEY, JWT_REFRESH_HASH_KEY, SALT_ROUNDS, APP_URL } = require('../../utils/constants/envConstants');
const { validateUniqueUser } = require('./helper');
const { sendEmailTemplateViaMailgun, sendMailViaGmail } = require('../../utils/helpers/email');
const { EMAIL_TEMPLATES, NODEMAILER_EMAIL_TEMPLATES } = require('../../utils/constants/constant');
const Product = require('../../models/product');
const Review = require('../../models/review');

const createUser = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) throw new httpError(null, 400, {}, 'Insufficient Data');
    let isUnique = await validateUniqueUser(username, email);
    if (!isUnique) throw new httpError(null, 409, {}, 'username or email already exits');
    // todo - verify user
    let redirectUrl = `${APP_URL}/user/v1/verify/${username}`;
    // sendEmailTemplateViaMailgun({ to: email, subject: 'Verify Your Email', template: EMAIL_TEMPLATES.email_verification.name, variables: { username, verifyEmailRedirectUrl } });
    sendMailViaGmail({ to: email, subject: 'Verify Your Email', templateName: NODEMAILER_EMAIL_TEMPLATES.email_verification.name, variables: { username, redirectUrl } });

    let genSalt = bcrypt.genSaltSync(SALT_ROUNDS);
    let salt = genSalt + SALT_ENV;
    let hashedPass = bcrypt.hashSync(password, salt);
    let user = await User.create({ username, password: hashedPass, email, salt: genSalt });
    let accessToken = jwt.sign({ username, userId: user._id }, JWT_ACCESS_HASH_KEY, { expiresIn: '1h' });
    let refreshToken = jwt.sign({ username, userId: user._id }, JWT_REFRESH_HASH_KEY, { expiresIn: '30d' });
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();
    return sendResponse(res, 200, { username, accessToken, refreshToken }, 'success!');
  } catch (err) {
    err.scope = err.scope || 'createUser';
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username && !email) throw new httpError(null, 400, {}, 'Bad request');
    let query = email ? { email } : { username };
    let user = await User.findOne(query).exec();
    if (!user) throw new httpError(null, 404, {}, 'User not found');
    let salt = user.salt + SALT_ENV;
    let hashedPass = bcrypt.hashSync(password, salt);
    if (hashedPass != user.password) throw new httpError(null, 401, {}, 'Authentication Failed');
    let accessToken = jwt.sign({ username: user.username, userId: user._id }, JWT_ACCESS_HASH_KEY, { expiresIn: '1h' });
    let refreshToken = jwt.sign({ username: user.username, userId: user._id }, JWT_REFRESH_HASH_KEY, { expiresIn: '30d' });
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();
    return sendResponse(res, 200, { refreshToken, accessToken, username: user.username }, 'success!');
  } catch (err) {
    err.scope = err.scope || 'loginUser';
    next(err);
  }
};

const updateAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new httpError(null, 400, {}, 'Bad Request');
    jwt.verify(refreshToken, JWT_REFRESH_HASH_KEY, (err, decoded) => {
      if (err) {
        throw new httpError(null, 401, {}, 'Invalid Token');
      }
      let accessToken = jwt.sign({ username: decoded.username, userId: decoded.userId }, JWT_ACCESS_HASH_KEY, { expiresIn: '1h' });
      return sendResponse(res, 200, { accessToken }, 'success');
    });
  } catch (err) {
    err.scope = err.scope || 'updateAccessToken';
    next(err);
  }
};

const checkValidUserName = async (req, res, next) => {
  try {
    let { username } = req.body;
    if (!username) throw new httpError(null, 400, {}, 'Insufficient Data');
    let count = await User.find({ username }).count();
    if (count > 0) return sendResponse(res, 409, {}, 'Already exists');
    return sendResponse(res, 200, {}, 'success!');
  } catch (err) {
    err.scope = err.scope || 'checkValidUserName';
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    let { username } = req.params;
    if (!username) throw new httpError(null, 400, {}, 'Insufficient Data');
    const user = await User.findOne({ username });
    if (!user) throw new httpError(null, 401, {}, 'Bad Request');
    user.isVerified = true;
    await user.save();
    return sendResponse(res, 200, {}, 'You Email is Verified Successfully');
  } catch (err) {
    err.scope = err.scope || 'checkValidUserName';
    next(err);
  }
};

const activity = async (req, res, next) => {
  try {
    const { activityType, userId, username } = req?.body;
    const { skip = 0, limit = 5 } = req?.query;
    if (!activityType) throw new httpError(null, 400, {}, 'Insufficient Data');
    let activity;
    if (activityType == 'post') {
      activity = await Product.find({ createdBy: userId }).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    } else if (activityType == 'comment') {
      activity = await Review.find({ userId: userId }).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    }
    return sendResponse(res, 200, activity, 'success!');
  } catch (err) {
    (err.scope = err.scope || 'activity'), next(err);
  }
};

module.exports = {
  createUser,
  loginUser,
  checkValidUserName,
  verifyEmail,
  updateAccessToken,
  activity,
};
