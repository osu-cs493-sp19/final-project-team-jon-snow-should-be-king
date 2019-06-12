
const router = require('express').Router();

const { getCoursesPage,
        CourseSchema,
        insertNewCourse,
        getCourseById,
        updateCourseById,
        deleteCourseById,
        getStudentsByCourseId,
        updateStudentsByCourseId,
        getRosterByCourseId,
        getAssignmentsByCourseId
      } = require('../models/course');

const { validateAgainstSchema } = require('../lib/validation');

const { requireAuthentication, isAdmin, validTeacherId } = require('../lib/auth');

/*
 * Route to return a paginated list of courses.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const coursePage = await getCoursesPage(parseInt(req.query.page) || 1);
    coursePage.links = {};
    if (coursePage.page < coursePage.totalPages) {
      coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
      coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
    }
    if (coursePage.page > 1) {
      coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
      coursePage.links.firstPage = '/courses?page=1';
    }
    res.status(200).send(coursePage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching courses list.  Please try again later."
    });
  }
});

/*
 * Route to create a new course.
 */
router.post('/', requireAuthentication, async (req, res) => {
  if (validateAgainstSchema(req.body, CourseSchema)) {
    if (isAdmin(req.role)) {
      try {
        const id = await insertNewCourse(req.body);
        res.status(201).send({
          id: id,
          links: {
            course: `/courses/${id}`
          }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting course into DB.  Please try again later."
        });
      }
    }else{
      res.status(403).send({
        error: "Entered credentials do not provide authorized access to this resouce"
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid course object."
    });
  }
});

/*
 * Route to fetch info about a specific course.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const course = await getCourseById(req.params.id, 0);
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch course.  Please try again later."
    });
  }
});

/*
 * Route to replace data for a course.
 */
router.patch('/:id', requireAuthentication, async (req, res, next) => {
  // NOTE: If it is a patch, do we need to worry about the schema?
  if (validateAgainstSchema(req.body, CourseSchema)) {
    if (isAdmin(req.role) || validTeacherId(req.params.id, req.role, req.user)) {
      try {
        const id = req.params.id
        const updateSuccessful = await updateCourseById(id, req.body);
        if (updateSuccessful) {
          res.status(200).send({
            links: {
              course: `/courses/${id}`
            }
          });
        } else {
          next();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Unable to update specified course.  Please try again later."
        });
      }
    }else {
      res.status(403).send({
        error: "Entered credentials do not provide authorized access to this resouce"
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid course object"
    });
  }
});

/*
 * Route to delete a course.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  if (isAdmin(req.role)) {
    try {
      const deleteSuccessful = await deleteCourseById(req.params.id);
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete course.  Please try again later."
      });
    }
  }else {
    res.status(403).send({
      error: "Entered credentials do not provide authorized access to this resouce"
    });
  }
});

/*
 *  Route to fetch students from a course
 */
router.get('/:id/students', requireAuthentication, async (req, res, next) => {
  if (isAdmin(req.role) || validTeacherId(req.params.id, req.role, req.user)) {
    try {
      const students = await getStudentsByCourseId(req.params.id);
      if (students) {
        res.status(200).send(students);
      } else { // NOTE: Will only hit if bas course id, not if no students
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to fetch students.  Please try again later."
      });
    }
  }else{
    res.status(403).send({
      error: "Entered credentials do not provide authorized access to this resouce"
    });
  }
});


/*
*  Route to update enrollment in a course
*/
router.post('/:id/students', requireAuthentication, async (req, res, next) => {
  if (isAdmin(req.role) || validTeacherId(req.params.id, req.role, req.user)) {
    if (req.body && req.body.add && req.body.remove) {
      try {
        const updateSuccessful = await updateStudentsByCourseId(req.params.id, req.body);
        if (updateSuccessful) {
          res.status(200).send();
        }else {
          next(); //404 error
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error updating students into DB.  Please try again later."
        });
      }
    } else {
      res.status(400).send({
        error: "Request body is not valid with add & remove fields."
      });
    }
  }else{
    res.status(403).send({
      error: "Entered credentials do not provide authorized access to this resouce"
    });
  }
});

/*
 *  Route to fetch a csv file of the students within a course
 */
 router.get('/:id/roster', requireAuthentication, async (req, res, next) => {
   if (isAdmin(req.role) || validTeacherId(req.params.id, req.role, req.user)) {
     try {
       const csvfile = await getRosterByCourseId(req.params.id);
       if (csvfile) {
         // TODO: Figure this out. Don't think we can just send the file like this
         res.status(200).send(csvfile);
       } else {
         next();
       }
     } catch (err) {
       console.error(err);
       res.status(500).send({
         error: "Unable to fetch roster of students.  Please try again later."
       });
     }
   }else{
     res.status(403).send({
       error: "Entered credentials do not provide authorized access to this resouce"
     });
   }
 });

/*
 *  Route to fetch assignments from a course
 */
 router.get('/:id/assignments', async (req, res, next) => {
   try {
     const assignments = await getAssignmentsByCourseId(req.params.id);
     if (assignments) {
       res.status(200).send(assignments);
     } else {
       next();
     }
   } catch (err) {
     console.error(err);
     res.status(500).send({
       error: "Unable to fetch assignments for the course.  Please try again later."
     });
   }
 });


module.exports = router;
