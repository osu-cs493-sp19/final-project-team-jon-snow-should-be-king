const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const { isAdmin, getAuthUser } = require('../lib/auth');
const bcrypt = require('bcryptjs');

/*
 * Schema for a User.
 */
const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true }
};
exports.UserSchema = UserSchema;

/*
 * Insert a new user into the database.
 */
async function insertNewUser(user, req) {
  const userToInsert = extractValidFields(user, UserSchema);
  const passwordHash = await bcrypt.hash(userToInsert.password, 8);
  const loggedInUser = await getUserById(getAuthUser(req));
  userToInsert.password = passwordHash;
  if ((userToInsert.role == 'admin' || userToInsert.role == 'instructor') && !isAdmin(loggedInUser.role)) {
    console.log(`!!!!! non admin user tried to add ${userToInsert.role} !!!!!`);
    return null;
  } else {
    const db = getDBReference();
    const collection = db.collection('users');
    const data = await collection.insertOne(userToInsert);
    return data.insertedId;
  }
};
exports.insertNewUser = insertNewUser;

/*
 * Fetch a user from the DB based on user's email.
 */
async function getUserByEmail(email) {
  const db = getDBReference();
  const collection = db.collection('users');
  return await collection.findOne({"email": email});
};
exports.getUserByEmail = getUserByEmail;

/*
 * Fetch a user from the DB based on user's email.
 */
async function getUserById(id) {
  const db = getDBReference();
  const collection = db.collection('users');
  const data = await collection.find({"_id": ObjectId(id)}).project({ email: 1, name: 1, role: 1}).toArray();
  return data[0];
};
exports.getUserById = getUserById;

/*
 * TESTING FUNCTION TO GET ALL USERS IN TABLE
 */
async function getAllUsers() {
  const db = getDBReference();
  const collection = db.collection('users');
  const data = await collection.find().toArray();
  return data;
};
exports.getAllUsers = getAllUsers;

/*
 * See if user email and password are good to login
 */
async function validateUser(email, password) {
  const user = await getUserByEmail(email);
  const authenticated = user && await bcrypt.compare(password, user.password);
  return authenticated;
};
exports.validateUser = validateUser;
