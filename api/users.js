/*
 * API sub-router for users collection endpoints.
 */

const router = require('express').Router();
const { requireAuthentication, generateAuthToken, isAdmin } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const { UserSchema, insertNewUser, getUserByEmail, validateUser, getUserById, getAllUsers } = require('../models/user');

/*
 * Route to insert a new user
 */
router.post('/', async (req, res) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    try {
      const id = await insertNewUser(req.body, req);
      if (id == null) {
        res.status(403).send({
          error: "The request was not made by an authenticated user."
        });
      } else {
        res.status(201).send({
          id: id
        });
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({
        error: "Error inserting new user. Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "The request body was either not present or did not contain a valid user object."
    });
  }
});

/*
 * Route to login a user.
 */
router.post('/login', async (req, res) => {
  if (req.body && req.body.email && req.body.password) {
    try {
      const authenticated = await validateUser(req.body.email, req.body.password);
      if (authenticated) {
        const person = await getUserByEmail(req.body.email);
        const token = generateAuthToken(person._id, person.role);
        res.status(200).send({
          token: token
        });
      } else {
        res.status(401).send({
          error: "Invalid credentials"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error validating user.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body was invalid"
    });
  }
});

/*
 * Route to get information about a user.
 */
router.get('/:id', requireAuthentication, async (req, res) => {
  const loggedInUser = await getUserByEmail(req.user);
  const id = req.params.id;
  if (loggedInUser._id == id || isAdmin(loggedInUser)) {
    try {
      const user = await getUserById(id);
      if (user) {
        res.status(200).send({
          user
        });
      } else {
        res.status(404).send({
          error: "User not found"
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error validating user.  Try again later."
      });
    }
  } else {
    res.status(403).send({
      error: "unauthorized to view user"
    });
  }
});

/*
 * TESTING ROUTE TO GET ALL USERS
 */
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    if (users) {
      res.status(200).send({
        users
      });
    } else {
      res.status(404).send({
        error: "Brett jacked something up. "
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Dont forget to purge your shit"
    });
  }
});

module.exports = router;
