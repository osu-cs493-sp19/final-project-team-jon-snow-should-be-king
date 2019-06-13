const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

/*
* Schema describing required/optional fields of an assignment object.
*/

const AssignmentSchema = {
  courseId: {required: true},
  title: {required: true},
  points: {required: true},
  due: {required: true}
};
exports.AssignmentSchema = AssignmentSchema;

/**
 * Inserts an assignment into the database 
 */
async function insertNewAssignment(assignment) {
  assignment = extractValidFields(assignment, AssignmentSchema);
  const db = getDBReference();
  const collection = db.collection('assignments');

  // TODO: Check that courseId is valid

  const result = await collection.insertOne(assignment);
  return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;

/**
 * Fetches an assignment from the database
 */
async function getAssignmentById(id) {
  const db = getDBReference();
  const collection = db.collection('assignments');

  if(!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getAssignmentById = getAssignmentById;

/**
 * Updates an assignment in the database
 */
async function updateAssignmentById(id, assignment) {
  const db = getDBReference();
  const collection = db.collection('assignments');

  if(!ObjectId.isValid(id)) {
    return false;
  } else {
    const updatedAssignment = await getAssignmentById(id);
    Object.keys(assignment).forEach(
      field => {
        if (updatedAssignment[field] != assignment[field]) {
          updatedAssignment[field] = assignment[field];
        }
      }
    );
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedAssignment }
    );
  }
  return true;
}
exports.updateAssignmentById = updateAssignmentById;

/**
 * Deletes an assignment from the database
 */
async function deleteAssignmentById(id) {
  const db = getDBReference();
  const collection = db.collection('assignments');
  
  if(!ObjectId.isValid(id)) {
    return false;
  } else {
    const results = await collection
      .find({_id: new ObjectId(id) })
      .toArray();
    if(results.length > 0) {
      await collection.deleteOne({ _id: id });
    }
  }

  return true;
}
exports.deleteAssignmentById = deleteAssignmentById;