const router = require('express').Router();

router.use('/users', require('./users'));
router.use('/courses', require('./coourses'));


module.exports = router;
