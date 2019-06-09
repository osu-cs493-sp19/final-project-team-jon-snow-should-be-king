/*
 * API sub-router for assignment collection endpoints.
 */

const router = require('express').Router();
const { validateAgainstSchema, validateISO8601Date } = require('../lib/validation');
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
  getSubmissionsPageByStudent,
  insertNewSubmission
 } = require('../models/submission');

/**
 * Route to insert an assignment
 */
router.post('/', async (req, res) => { 
   if(
      validateAgainstSchema(req.body, AssignmentSchema) &&
      Number.isInteger(req.body.points) &&
      validateISO8601Date(req.body.due)
    ) {
      try {
        const id = await insertNewAssignment(req.body);
        res.status(201).send({
          id: id
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting assignment into DB. Please try again later."
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
router.put('/:id', async (req, res, next) => {
  if(
    validateAgainstSchema(req.body, AssignmentSchema) &&
    Number.isInteger(req.body.points) &&
    validateISO8601Date(req.body.due)
  ) {
    try {
      const id = parseInt(req.params.id);
      const success = await updateAssignmentById(id, req.body);
      if(success) {
        res.status(200).send();
      } else { 
        next();
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
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const success = await deleteAssignmentById(id);
    if(success) {
      res.status(204).send();
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to delete assignment. Please try again later."
    });
  }
});

router.get('/:id/submissions', async (req, res, next) => {
  const id = parseInt(req.params.id);
  try {
    let submissionsPage;
    if(req.query.studentId) {
      submissionsPage = await getSubmissionsPageByStudent(
        id, 
        parseInt(req.query.studentId), 
        parseInt(req.query.page) || 1
      );
    } else {
      submissionsPage = await getSubmissionsPage(
        id, 
        parseInt(req.query.page) || 1
      );
    }
    if(submissionsPage && submissionsPage.length > 0) {
      res.status(200).send({
        submissions: submissionsPage
      });
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching submissions page. Please try again later."
    });
  }
});

router.post('/:id/submissions', async (req, res) => {
  if(validateAgainstSchema(req.body, SubmissionSchema)) {
    try {
      const id = await insertNewSubmission(req.body);

      // TODO: File stuff

      res.status(201).send({
        id: id
      });
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