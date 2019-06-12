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

db.users.insertMany([
  {
    "name": "admin",
    "email": "admin@admin",
    "password": "$2a$08$UhKY3YdAM9eFEQadLODgpugQ24ygiDZds1mmSfKLGTjVxclDWRyHO",
    "role": "admin"
  },
  {
    "name": "Brett Case",
    "email": "casebr@oregonstate.edu",
    "password": "burtIsAQTPie",
    "role": "student"
  }
]);
