const { Router } = require('express');
const { createUser } = require('./controllers');
const router = Router();

// create Login route

router.get('/', (req, res) => {
  res.send('hello from user');
});

router.post('/user', createUser);

module.exports = router;
