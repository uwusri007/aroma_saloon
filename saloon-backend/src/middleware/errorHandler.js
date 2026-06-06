const { error } = require('../utils/response');

function notFound(req, res) {
  return error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return error(res, message, statusCode, err.errors || null);
}

module.exports = { notFound, errorHandler };
