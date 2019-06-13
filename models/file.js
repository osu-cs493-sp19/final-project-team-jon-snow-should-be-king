const { ObjectId, GridFSBucket } = require('mongodb');
const { getDBReference } = require('../lib/mongo');

function getFileDownloadStreamById(id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
  if(!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
}
exports.getFileDownloadStreamById = getFileDownloadStreamById;