const router = require('express').Router();

router.use('/users', require('./users'));
router.use('/assignments', require('./assignments'));
router.use('/courses', require('./courses'));

module.exports = router;
