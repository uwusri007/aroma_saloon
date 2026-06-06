const { query } = require('../config/db');
const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const users = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active, r.name as role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!users.length || !users[0].is_active) {
      return error(res, 'Invalid or inactive account', 401);
    }

    req.user = users[0];
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
