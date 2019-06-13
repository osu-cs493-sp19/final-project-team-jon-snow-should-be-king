const router = require('express').Router();
const { 
    getFileDownloadStreamById
} = require('../models/file');

router.get('/:id', async (req, res, next) => {
    let id = req.params.id;
    getFileDownloadStreamById(id)
        .on('file', (file) => {
            res.status(200);
        })
        .on('error', (err) => {
            if(err.code === 'ENOENT') {
                next();
            } else {
                next(err);
            }
        })
        .pipe(res);
});

module.exports = router;