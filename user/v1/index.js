const { Router } = require('express');
const { createUser, loginUser, checkValidUserName, verifyEmail, updateAccessToken, activity } = require('./controllers');
const { isAuthenticated } = require('../../utils/helpers/helper');
const router = Router();

router.post('/user', createUser);

router.post('/login', loginUser);

router.post('/validateUsername', checkValidUserName);

// renew access token using refresh token
router.post('/renewToken', updateAccessToken);

// route to varify user email id after signup
router.get('/verify/:username', verifyEmail);

//? get user's activity
router.post('/activity', isAuthenticated, activity);

module.exports = router;
