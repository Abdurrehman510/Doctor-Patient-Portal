const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await require('../models/User').findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
      }
      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

module.exports = authMiddleware;