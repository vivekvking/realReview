const { Router } = require('express');
const v1 = require('./v1');
let router = Router();

router.use('/v1', v1);

module.exports = router;
