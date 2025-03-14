const jwt = require('jsonwebtoken')

exports.verifyToken = async (req, res, next) => {
    try {
        if (['/auth/login', '/auth/register', '/auth/verifyOauthAccessToken'].includes(req.path))
            return next();
        else {
            const token = req.headers["authorization"]?.split(" ")?.[1];
            if (!token)
                return res.status(403).json({ code: 'missing-token', message: "No token provided" });
            const tokenIsValid = jwt.verify(token, process.env.JWT_SECRET);
            if (!tokenIsValid)
                return res.status(401).json({ code: 'invalid-token', message: 'Access denied' });

            return next();
        }
    } catch (err) {
        return res.status(401).json({ code: 'invalid-token', message: 'Access denied' })
    }
}