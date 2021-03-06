/*
 * Course schema and data accessor methods;
 */

const { ObjectId } = require('mongodb');
const { Parser } = require('json2csv');

const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const { getUserById } = require('./user');
//const { getPhotosByBusinessId } = require('./photo');

/*
 * Schema describing required/optional fields of a course object.
 */
const CourseSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId: { required: true },
  student_list: { required: false }
};
exports.CourseSchema = CourseSchema;
/*
 * Executes a DB query to return a single page of courses.  Returns a
 * Promise that resolves to an array containing the fetched page of courses.
 */
async function getCoursesPage(page) {
  const db = getDBReference();
  const collection = db.collection('courses');
  const count = await collection.countDocuments();

  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection.find({}, {projection:{ student_list: 0 }})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getCoursesPage = getCoursesPage;

/*
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const db = getDBReference();
  const collection = db.collection('courses');
  const result = await collection.insertOne(course);
  return result.insertedId;
}
exports.insertNewCourse = insertNewCourse;

/*
 * Executes a DB query to fetch information about a single specified
 * course based on its ID.  Does not fetch photo data for the
 * course.  Returns a Promise that resolves to an object containing
 * information about the requested course.  If no course with the
 * specified ID exists, the returned Promise will resolve to null.
 * includeStudents will hide students if set to 0, or will show
 * students if set to 1.
 */
async function getCourseById(id, includeStudents) {
  const db = getDBReference();
  const collection = db.collection('courses');
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) }, {projection:{ student_list: includeStudents }})
      .toArray();
    return results[0];
  }
}
exports.getCourseById = getCourseById;
/*
 * Executes a DB query to replace a specified course with new data.
 * Returns a Promise that resolves to true if the course specified by
 * `id` existed and was successfully updated or to false otherwise.
 */
 async function updateCourseById(id, course) {
   const db = getDBReference();
   const collection = db.collection('courses');
   if (!ObjectId.isValid(id)) {
     return false;
   } else {
     const updatedCourse = await getCourseById(id, 0);
     //update course values if given fields are different
     updatedCourse.subject = updatedCourse.subject!=course.subject&&course.subject?course.subject:updatedCourse.subject;
     updatedCourse.number = updatedCourse.number!=course.number&&course.number?course.number:updatedCourse.number;
     updatedCourse.title = updatedCourse.title!=course.title&&course.title?course.title:updatedCourse.title;
     updatedCourse.term = updatedCourse.term!=course.term&&course.term?course.term:updatedCourse.term;
     updatedCourse.instructorId = updatedCourse.instructorId!=course.instructorId&&course.instructorId?course.instructorId:updatedCourse.instructorId;
     const result = await collection.updateOne(
       { _id: new ObjectId(id) },
       //set e/ field within course, instead of a full replacement
       {$set: {
                "subject":updatedCourse.subject,
                "number": updatedCourse.number,
                "title": updatedCourse.title,
                "term": updatedCourse.term,
                "instructorId": updatedCourse.instructorId
              }
        }
     );
     return true;
   }
 }
 exports.updateCourseById = updateCourseById;

 /*
  * Executes a DB query to delete a course specified by its ID.  Returns
  * a Promise that resolves to true if the course specified by `id` existed
  * and was successfully deleted or to false otherwise.
  */
 async function deleteCourseById(id) {
   const db = getDBReference();
   const collection = db.collection('courses');
   const result = await collection.deleteOne({
     _id: new ObjectId(id)
   });
   return result.deletedCount > 0;
 }
 exports.deleteCourseById = deleteCourseById;

 /*
  * Executes a DB query to get the students enrolled in a specified course.
  * Returns a Promise of the students enrolled in the course, or returns an
  * empty object if the id is null.
  */
 async function getStudentsByCourseId(id) {
   const course = await getCourseById(id, 1);
   //work smarter, not harder.
   //Considering we are storing the student list in the course collection,
   // just print that out
   if (course) {
     let studentlist = {
        "students": []
     }
     studentlist.students = course.student_list;
     return studentlist;
   } else {
     return null;
   }
 }exports.getStudentsByCourseId = getStudentsByCourseId;

 /*
  * Executes a DB query to update the students within a course.  Returns
  * a Promise that resolves to true if the course was updated successfully
  * or to false otherwise.
  */
 async function updateStudentsByCourseId(id, changes){
   const adds = changes.add;
   const removes = changes.remove;

   const db = getDBReference();
   const collection = db.collection('courses');
   const users = db.collection('users');
   const course = await getCourseById(id);
   if (!ObjectId.isValid(id)) {
     return false;
   } else {
     for (i in adds){
       const result = await collection.updateOne(
         { _id: new ObjectId(id) },
         { $push: { student_list: adds[i] } }
       );
       const userResult = await users.updateOne(
         { _id: new ObjectId(adds[i]) },
         { $push: {courses: course}}
       );
     };
     for (j in removes){
       const result = await collection.updateOne(
         { _id: new ObjectId(id) },
         { $pull: { student_list: removes[j] } }
       );
       const userResult = await users.updateOne(
        { _id: new ObjectId(removes[j]) },
        { $pull: {courses: id}}
      );
     };
     return true;
   }
 }exports.updateStudentsByCourseId = updateStudentsByCourseId;

 /*
  * Executes a DB query to fetch a csv file of the students within a course.
  * Returns the csv file of the students enrolled in the course with some
  * student information.
  */
 async function getRosterByCourseId(id){
   const CsvSchema = {
     _id: { required: true },
     name: { required: true },
     email: { required: true }
   };
   const studentsJSON = [];
   const studentFields = [
      { label: 'ID', value: '_id'},
      { label: 'Name', value: 'name'},
      { label: 'Email', value: 'email'}
  ];

   const studentIds = await getStudentsByCourseId(id);

   for (i in studentIds.students){
     // NOTE: When Brett has Users up, check on getUserById naming
     const student = await getUserById(studentIds.students[i]);
     studentsJSON.push(student);
   }
   const studentsCSV = [];
   for (i in studentsJSON){
     studentsCSV.push(extractValidFields(studentsJSON[i], CsvSchema))
   }

   const json2csvParser = new Parser({ studentFields });
   const csv = json2csvParser.parse(studentsCSV);

   console.log(csv);

   return csv;

 }exports.getRosterByCourseId = getRosterByCourseId;

 /*
  * Executes a DB query to fetch the assignments of a specified course.
  * Returns the id's of the assignments of the course, or an empty object
  * if the course id is incorrect.
  */
 async function getAssignmentsByCourseId(id){
   const db = getDBReference();
   const collection = db.collection('assignments');
   let assignIds = {
     "assignments": []
   };
   if (!ObjectId.isValid(id)) {
     console.log("id not valid");
     return null;
   } else {
     const results = await collection
       .find({ courseId: id })
       .toArray();
     for (i in results){
       assignIds.assignments.push(results[i]._id);
     }
     return assignIds;
   }
 }exports.getAssignmentsByCourseId = getAssignmentsByCourseId;
