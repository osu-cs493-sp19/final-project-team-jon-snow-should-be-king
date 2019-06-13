db.users.insertMany([
  {
    "name": "admin",
    "email": "admin@admin",
    "password": "$2a$08$UhKY3YdAM9eFEQadLODgpugQ24ygiDZds1mmSfKLGTjVxclDWRyHO",
    "role": "admin"
  }
]);

db.createCollection("courses");
db.createCollection("assignments");