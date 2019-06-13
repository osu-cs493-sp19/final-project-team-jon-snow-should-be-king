const fs = require('fs');
const { ObjectId, GridFSBucket } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
* Schema describing required/optional fields of a submission object.
*/

const SubmissionSchema = {
  assignmentId: {required: true},
  studentId: {required: true},
  timestamp: {required: true}
};
exports.SubmissionSchema = SubmissionSchema;

async function getSubmissionsPage(id, studentId, page) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, {bucketName: 'submissions'});

  if(!ObjectId.isValid(id)) {
    return null;
  } else {
    const count = (await bucket.find({}).toArray()).length;
    
    const pageSize = 2;
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    offset = (page - 1) * pageSize;

    // If studentId exists in this context, query by studentId else just look for the assignmentId entry
    const results = await (!!studentId ?
      await bucket
        .find({ 
          'metadata.assignmentId': new ObjectId(id), 
          'metadata.studentId': new ObjectId(studentId) 
        }) :
      await bucket
        .find({
        'metadata.assignmentId': new ObjectId(id)
        })
      )
      .sort({ _id: 1 })
      .skip(offset)
      .limit(pageSize)
      .toArray();
    
    // Reformat all returned results
    results.forEach((result, i) => {
      results[i] = {
        assignmentId: result.metadata.assignmentId,
        studentId: result.metadata.studentId,
        timestamp: result.metadata.timestamp,
        file: `/files/${result._id}`
      }
    });

    return {
      submissions: results,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count
    };
  }
}
exports.getSubmissionsPage = getSubmissionsPage;

async function insertNewSubmission(submission, file) {
  return new Promise((resolve, reject) => {
    const metadata = extractValidFields(submission, SubmissionSchema);
    metadata.assignmentId = ObjectId(metadata.assignmentId);
    metadata.studentId = ObjectId(metadata.studentId);

    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
    const uploadStream = bucket.openUploadStream(
      file.filename,
      {metadata: metadata}
    );

    fs.createReadStream(file.path)
      .pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
}
exports.insertNewSubmission = insertNewSubmission;