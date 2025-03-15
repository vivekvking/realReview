const { Router } = require('express');
const { createUser, loginUser, checkValidUserName, verifyEmail, updateAccessToken, activity, getUserProfile, getAllUserActivity } = require('./controllers');
const { isAuthenticated } = require('../../utils/helpers/helper');
const router = Router();

router.post('/user', createUser);

router.post('/login', loginUser);

router.post('/validateUsername', checkValidUserName);

// renew access token using refresh token
router.post('/renewToken', updateAccessToken);

// route to varify user email id after signup
router.get('/verify/:username', verifyEmail);

//? get user's activity by type (post, review, comment)
router.post('/activity', isAuthenticated, activity);

// get user profile
router.get('/profile', isAuthenticated, getUserProfile);

// get all user activity (products, reviews, comments) in a single request
router.get('/all-activity', isAuthenticated, getAllUserActivity);

module.exports = router;
