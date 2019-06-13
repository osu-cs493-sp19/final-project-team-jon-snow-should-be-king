const jwt = require('jsonwebtoken');
const secretKey = 'TotallySecretSecretKey';

exports.generateAuthToken = function (userId, role) {
    const payload = { sub: userId , role: role };
    const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
    return token;
};

exports.getAuthUser = function(request){
    const authHeader = request.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        return payload.sub;
    } catch (err) {
        console.error("  -- error:", err);
        return null;
    }
};

exports.isAdmin = function (role) {
    return role == 'admin' ? true : false;
};

const { getCourseById, getStudentsByCourseId } = require('../models/course');

exports.validTeacherId = async function(courseId, role, id) {
    const course = await getCourseById(courseId, 0);
    if (role == 'instructor') {
      return id == course.instructorId ? true : false;
    }else return false;
};

exports.validStudentId = async function(courseId, role, id) {
    const students = (await getStudentsByCourseId(courseId)).students;
    if (role == 'student') {
        for(let i = 0; i < students.length; i++) {
            if(students[i] == id)
                return true;
        }
    }
    return false;
}

exports.requireAuthentication = function (req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        req.user = payload.sub;
        req.role = payload.role;
        next();
    } catch (err) {
        console.error("  -- error:", err);
        res.status(401).send({
            error: "Invalid authentication token provided."
        });
    }
};
