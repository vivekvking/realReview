const { Router } = require('express');
const { createUser, loginUser, checkValidUserName, verifyEmail } = require('./controllers');
const router = Router();

router.post('/user', createUser);

router.post('/login', loginUser);

router.post('/validateUsername', checkValidUserName);

// route to varify user email id after signup
router.get('/verify/:username', verifyEmail);

module.exports = router;
