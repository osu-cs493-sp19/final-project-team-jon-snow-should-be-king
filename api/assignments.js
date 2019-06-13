/*
 * API sub-router for assignment collection endpoints.
 */

const fs = require('fs');
const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const { validateAgainstSchema, validateISO8601Date } = require('../lib/validation');
const { requireAuthentication, isAdmin, validTeacherId, validStudentId } = require('../lib/auth');
const { 
  AssignmentSchema,
  insertNewAssignment,
  getAssignmentById,
  updateAssignmentById,
  deleteAssignmentById
} = require('../models/assignment');
const { 
  SubmissionSchema,
  getSubmissionsPage,
  insertNewSubmission
 } = require('../models/submission');

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      callback(null, `${filename}`);
    }
  })
});

function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if(err) reject(err);
      else resolve();
    })
  })
}


/**
 * Route to insert an assignment
 */
router.post('/', requireAuthentication, async (req, res) => {
  if(
    validateAgainstSchema(req.body, AssignmentSchema) &&
    Number.isInteger(req.body.points) &&
    validateISO8601Date(req.body.due)
  ) {
    if(isAdmin(req.role) || await validTeacherId(req.body.courseId, req.role, req.user)) {
      try {
        const id = await insertNewAssignment(req.body);
        res.status(201).send({
          id: id,
          links: {
            assignment: `/assignments/${id}`
          }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting assignment into DB. Please try again later."
        });
      }
    } else {
      res.status(403).send({
        error: "Entered credentials do not provide authorized access to this resource"
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid assignment object."
    });
  }
});

/**
 * Route to fetch an assignment
 */
router.get('/:id', async (req, res, next) => {
  try {
    const assignment = await getAssignmentById(req.params.id);
    if(assignment) {
      res.status(200).send(assignment);
    } else {
      next();
    }
  } catch(err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch assignment. Please try again later."
    });
  }
});

/**
 * Route to update an assignment
 */
router.put('/:id', requireAuthentication, async (req, res, next) => {
  if(
    validateAgainstSchema(req.body, AssignmentSchema) &&
    Number.isInteger(req.body.points) &&
    validateISO8601Date(req.body.due)
  ) {
    try {
      const assignment = await getAssignmentById(req.params.id);
      if(isAdmin(req.role) || await validTeacherId(assignment.courseId, req.role, req.user)) {
        const success = await updateAssignmentById(req.params.id, req.body);
        if(success) {
          res.status(200).send();
        } else {
          next();
        }
      } else {
        res.status(403).send({
          error: "Entered credentials do not provide authorized access to this resource"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to update specified assignment. Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid assignment object."
    });
  }
});

/**
 * Route to delete an assignment
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
  try {
    const assignment = await getAssignmentById(req.params.id);
    if(isAdmin(req.role) || await validTeacherId(assignment.courseId, req.role, req.user)) {
      const id = req.params.id;
      const success = await deleteAssignmentById(id);
      if(success) {
        res.status(204).send();
      } else {
        next();
      }
    } else {
      res.status(403).send({
        error: "Entered credentials do not provide authorized access to this resource"
      })
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to delete assignment. Please try again later."
    });
  }
});

router.get('/:id/submissions', requireAuthentication, async (req, res, next) => {
  const id = req.params.id;
  const studentId = req.query.studentId
  try {
    const assignment = await getAssignmentById(req.params.id);
    if(isAdmin(req.role) || await validTeacherId(assignment.courseId, req.role, req.user)) {
      const submissionsPage = await getSubmissionsPage(
        id, 
        studentId, 
        parseInt(req.query.page) || 1
      );
      if(submissionsPage.submissions && submissionsPage.submissions.length > 0) {
        submissionsPage.links = {};
        if (submissionsPage.page < submissionsPage.totalPages) {
          submissionsPage.links.nextPage = `/assignments/${id}/submissions?page=${submissionsPage.page + 1}`
            + (!!studentId ? `studentId=${studentId}` : '');
          submissionsPage.links.lastPage = `/assignments/${id}/submissions?page=${submissionsPage.totalPages}`
            + (!!studentId ? `studentId=${studentId}` : '');
        }
        if (submissionsPage.page > 1) {
          submissionsPage.links.prevPage = `/assignments/${id}/submissions?page=${submissionsPage.page - 1}`
            + (!!studentId ? `studentId=${studentId}` : '');
          submissionsPage.links.firstPage = `/assignments/${id}/submissions?page=1`
            + (!!studentId ? `studentId=${studentId}` : '');
        }
        res.status(200).send(submissionsPage);
      } else {
        next();
      }
    } else {
      res.status(403).send({
        error: "Entered credentials do not provide authorized access to this resource"
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching submissions page. Please try again later."
    });
  }
});

router.post('/:id/submissions', requireAuthentication, upload.single('file'), async (req, res) => {
  if(validateAgainstSchema(req.body, SubmissionSchema)) {
    try {
      const assignment = await getAssignmentById(req.params.id);
      if(isAdmin(req.role) || await validStudentId(assignment.courseId, req.role, req.user)) {
        const id = await insertNewSubmission(req.body, req.file);
        await removeUploadedFile(req.file);
        res.status(201).send({
          url: `/files/${id}`
        });
      } else {
        res.status(403).send({
          error: "Entered credentials do not provide authorized access to this resource"
        })
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error inserting submission into DB. Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid submission object."
    });
  }
});

module.exports = router;