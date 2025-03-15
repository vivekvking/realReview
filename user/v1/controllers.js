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
    const { username, password, email, profilePic } = req.body;
    if (!username || !password || !email) throw new httpError(null, 400, {}, 'Insufficient Data');
    let isUnique = await validateUniqueUser(username, email);
    if (!isUnique) throw new httpError(null, 409, {}, 'username or email already exits');
    let genSalt = bcrypt.genSaltSync(SALT_ROUNDS);
    let salt = genSalt + SALT_ENV;
    let hashedPass = bcrypt.hashSync(password, salt);
    let user = await User.create({ username, password: hashedPass, email, salt: genSalt, profilePic: profilePic });
    let accessToken = jwt.sign({ username, userId: user._id }, JWT_ACCESS_HASH_KEY, { expiresIn: '1h' });
    let refreshToken = jwt.sign({ username, userId: user._id }, JWT_REFRESH_HASH_KEY, { expiresIn: '30d' });
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    // todo - verify user
    let redirectUrl = `${APP_URL}/user/v1/verify/${username}`;
    // sendEmailTemplateViaMailgun({ to: email, subject: 'Verify Your Email', template: EMAIL_TEMPLATES.email_verification.name, variables: { username, verifyEmailRedirectUrl } });
    // sendMailViaGmail({ to: email, subject: 'Verify Your Email', templateName: NODEMAILER_EMAIL_TEMPLATES.email_verification.name, variables: { username, redirectUrl } });

    return sendResponse(res, 200, { username, accessToken, refreshToken, redirectUrl }, 'success!');
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
    let count = await User.countDocuments({ username });
    if (count > 0) return sendResponse(res, 409, {}, 'Already exists');
    return sendResponse(res, 200, {}, 'success!');
  } catch (err) {
    err.scope = err.scope || 'checkValidUserName';
    next(err);
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
    const { activityType } = req?.body;
    const userId = req.userId; // This comes from the isAuthenticated middleware
    const { skip = 0, limit = 10 } = req?.query;
    
    if (!activityType) throw new httpError(null, 400, {}, 'Insufficient Data');
    if (!userId) throw new httpError(null, 401, {}, 'Unauthorized');
    
    let activity = [];
    
    try {
      if (activityType === 'post') {
        // Get products created by the user
        activity = await Product.find({ createdBy: userId })
          .populate({ path: 'category', strictPopulate: false })
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .lean();
          
        // Add review count and average rating to each product
        for (let product of activity) {
          const reviews = await Review.find({ 
            productId: product._id,
            parentId: { $exists: false } // Only count top-level reviews, not comments
          });
          
          product.reviewCount = reviews.length;
          
          if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            product.avgRating = totalRating / reviews.length;
          } else {
            product.avgRating = 0;
          }
          
          // Ensure both category and categoryId are set
          if (product.category && !product.categoryId) {
            product.categoryId = product.category;
          } else if (product.categoryId && !product.category) {
            product.category = product.categoryId;
          }
        }
      } else if (activityType === 'review') {
        // Get reviews created by the user (not comments)
        activity = await Review.find({ 
          userId: userId,
          parentId: { $exists: false } // Only get top-level reviews, not comments
        })
          .populate({ path: 'productId', strictPopulate: false })
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .lean();
          
        // Add type field to indicate these are reviews
        activity = activity.map(item => ({
          ...item,
          type: 'review'
        }));
      } else if (activityType === 'comment') {
        // Get comments created by the user
        activity = await Review.find({ 
          userId: userId,
          parentId: { $exists: true } // Only get comments (which have a parentId)
        })
          .populate({ path: 'productId', strictPopulate: false })
          .populate({ path: 'parentId', strictPopulate: false })
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .lean();
          
        // Add type field to indicate these are comments and ensure reviewId is set
        activity = activity.map(item => {
          // Ensure reviewId is set (for backward compatibility)
          if (item.parentId && !item.reviewId) {
            item.reviewId = item.parentId;
          }
          
          return {
            ...item,
            type: 'comment'
          };
        });
      } else if (activityType === 'all') {
        // Get all activity (products, reviews, and comments)
        const products = await Product.find({ createdBy: userId })
          .populate({ path: 'category', strictPopulate: false })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit) / 3) // Divide limit among the three types
          .lean()
          .then(products => products.map(p => {
            // Ensure both category and categoryId are set
            if (p.category && !p.categoryId) {
              p.categoryId = p.category;
            } else if (p.categoryId && !p.category) {
              p.category = p.categoryId;
            }
            
            return {
              ...p, 
              type: 'product'
            };
          }));
          
        const reviews = await Review.find({ 
          userId: userId,
          parentId: { $exists: false }
        })
          .populate({ path: 'productId', strictPopulate: false })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit) / 3)
          .lean()
          .then(reviews => reviews.map(r => ({
            ...r, 
            type: 'review'
          })));
          
        const comments = await Review.find({ 
          userId: userId,
          parentId: { $exists: true }
        })
          .populate({ path: 'productId', strictPopulate: false })
          .populate({ path: 'parentId', strictPopulate: false })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit) / 3)
          .lean()
          .then(comments => comments.map(c => {
            // Ensure reviewId is set (for backward compatibility)
            if (c.parentId && !c.reviewId) {
              c.reviewId = c.parentId;
            }
            
            return {
              ...c, 
              type: 'comment'
            };
          }));
          
        // Combine all activity and sort by createdAt
        activity = [...products, ...reviews, ...comments]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, parseInt(limit));
      }
    } catch (err) {
      console.error(`Error in activity controller (${activityType}):`, err);
      // Continue with empty activity array instead of failing completely
      activity = [];
    }
    
    return sendResponse(res, 200, activity, 'success!');
  } catch (err) {
    err.scope = err.scope || 'activity';
    next(err);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId; // This comes from the isAuthenticated middleware
    if (!userId) throw new httpError(null, 401, {}, 'Unauthorized');
    
    const user = await User.findById(userId).select('username email profilePic isVerified');
    if (!user) throw new httpError(null, 404, {}, 'User not found');
    
    return sendResponse(res, 200, user, 'success!');
  } catch (err) {
    err.scope = err.scope || 'getUserProfile';
    next(err);
  }
};

const getAllUserActivity = async (req, res, next) => {
  try {
    const userId = req.userId; // This comes from the isAuthenticated middleware
    const { skip = 0, limit = 20 } = req?.query;
    
    if (!userId) throw new httpError(null, 401, {}, 'Unauthorized');
    
    // Get products created by the user
    const products = await Product.find({ createdBy: userId })
      .populate({ path: 'category', strictPopulate: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 3) // Divide limit among the three types
      .lean()
      .then(products => products.map(p => {
        // Ensure both category and categoryId are set
        if (p.category && !p.categoryId) {
          p.categoryId = p.category;
        } else if (p.categoryId && !p.category) {
          p.category = p.categoryId;
        }
        
        return {
          ...p, 
          type: 'product'
        };
      }));
      
    // Get reviews created by the user (not comments)
    const reviews = await Review.find({ 
      userId: userId,
      parentId: { $exists: false }
    })
      .populate({ path: 'productId', strictPopulate: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 3)
      .lean()
      .then(reviews => reviews.map(r => ({
        ...r, 
        type: 'review'
      })));
      
    // Get comments created by the user
    const comments = await Review.find({ 
      userId: userId,
      parentId: { $exists: true }
    })
      .populate({ path: 'productId', strictPopulate: false })
      .populate({ path: 'parentId', strictPopulate: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 3)
      .lean()
      .then(comments => comments.map(c => {
        // Ensure reviewId is set (for backward compatibility)
        if (c.parentId && !c.reviewId) {
          c.reviewId = c.parentId;
        }
        
        return {
          ...c, 
          type: 'comment'
        };
      }));
      
    // Combine all activity and sort by createdAt
    const allActivity = [...products, ...reviews, ...comments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));
    
    return sendResponse(res, 200, allActivity, 'success!');
  } catch (err) {
    err.scope = err.scope || 'getAllUserActivity';
    next(err);
  }
};

module.exports = {
  createUser,
  loginUser,
  checkValidUserName,
  verifyEmail,
  updateAccessToken,
  activity,
  getUserProfile,
  getAllUserActivity,
};
