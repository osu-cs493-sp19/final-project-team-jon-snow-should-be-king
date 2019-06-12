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

function getPageOffset(page, itemCount, itemsPerPage) {
  const lastPage = Math.ceil(itemCount / itemsPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  return (page - 1) * itemsPerPage;
}

async function getSubmissionsPage(id, page) {
  // TODO: Mongo, get collection and count it
  const db = getDBReference();
  const count = 0;

  const pageSize = 2;
  offset = getPageOffset(page, count, pageSize);

  // TODO: Get page from collection using offset, pageSize and id
  const results = [1, 2];

  return results;
}
exports.getSubmissionsPage = getSubmissionsPage;

async function getSubmissionsPageByStudent(id, studentId, page) {
  // TODO: Mongo, get collection and count it
  const count = 0;

  const pageSize = 2;
  offset = getPageOffset(page, count, pageSize);

  // TODO: Get page from collection using offset, pageSize, id and studentId
  const results = [1, 5];

  return results;
}
exports.getSubmissionsPageByStudent = getSubmissionsPageByStudent;

async function insertNewSubmission(submission) {
  // TODO: Mongo and file stuff
  return 0;
}
exports.insertNewSubmission = insertNewSubmission;