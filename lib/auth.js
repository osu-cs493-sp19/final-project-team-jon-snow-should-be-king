const jwt = require('jsonwebtoken');
const secretKey = 'TotallySecretSecretKey';

exports.generateAuthToken = function (userId) {
    const payload = { sub: userId };
    const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
    return token;
};

exports.isAdmin = function (user) {
    return user.role == 'admin' ? true : false;
};

exports.getAuthUser = function(req){
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        return payload.sub;
    } catch (err) {
        console.error("  -- error:", err);
        return null;
    }
}

exports.requireAuthentication = function (req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        req.user = payload.sub;
        next();
    } catch (err) {
        console.error("  -- error:", err);
        res.status(401).send({
            error: "Invalid authentication token provided."
        });
    }
};