db.assignments.insertMany([
  {
    "courseId": "123",
    "title": "Assignment 3",
    "points": 100,
    "due": "2019-06-14T17:00:00-07:00"
  }
]);

db.users.insertMany([
  {
    "name": "admin",
    "email": "admin@admin",
    "password": "$2a$08$UhKY3YdAM9eFEQadLODgpugQ24ygiDZds1mmSfKLGTjVxclDWRyHO",
    "role": "admin"
  }
]);