const { Router } = require('express');
const { createUser, loginUser, checkValidUserName } = require('./controllers');
const router = Router();

router.post('/user', createUser);

router.post('/login', loginUser);

router.post('/validateUsername', checkValidUserName);

module.exports = router;
