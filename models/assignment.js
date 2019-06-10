
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
  // TODO: Mongo
  return 0;
}
exports.insertNewAssignment = insertNewAssignment;

/**
 * Fetches an assignment from the database
 */
async function getAssignmentById(id) {
  // TODO: Mongo
  return {
    "courseId": id,
    "title": "Assignment 3",
    "points": 100,
    "due": "2019-06-14T17:00:00-07:00"
  };
}
exports.getAssignmentById = getAssignmentById;

/**
 * Updates an assignment in the database
 */
async function updateAssignmentById(id, assignment) {
  // TODO: Mongo
  return true;
}
exports.updateAssignmentById = updateAssignmentById;

/**
 * Deletes an assignment from the database
 */
async function deleteAssignmentById(id) {
  // TODO: Mongo
  return true;
}
exports.deleteAssignmentById = deleteAssignmentById;