const { Router } = require('express');
const { createUser, loginUser, checkValidUserName } = require('./controllers');
const router = Router();

// create Login route

router.get('/', (req, res) => {
  res.send('hello from user');
});

router.post('/user', createUser);

router.post('/login', loginUser);

router.post('/validateUsername', checkValidUserName);

module.exports = router;
