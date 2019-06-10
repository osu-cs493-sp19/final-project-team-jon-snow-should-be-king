db.assignments.insertMany([
  {
    "courseId": "123",
    "title": "Assignment 3",
    "points": 100,
    "due": "2019-06-14T17:00:00-07:00"
  }
]);
db.courses.insertMany([
  {
    "subject": "CS",
    "number": "493",
    "title": "Cloud Application Development",
    "term": "sp19",
    "instructorId": "1",
    "student_list": ["123", "234"]
  }
]);
