/*
 * API sub-router for users collection endpoints.
 */

const router = require('express').Router();

router.get('/', async (req, res) => { 
   res.status(204).send();
});

module.exports = router;

