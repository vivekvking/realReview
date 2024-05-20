const { Router } = require('express');
const { createUser, loginUser, checkValidUserName, verifyEmail, updateAccessToken } = require('./controllers');
const router = Router();

router.post('/user', createUser);

router.post('/login', loginUser);

router.post('/validateUsername', checkValidUserName);

// renew access token using refresh token
router.post('/renewToken', updateAccessToken);

// route to varify user email id after signup
router.get('/verify/:username', verifyEmail);

module.exports = router;
