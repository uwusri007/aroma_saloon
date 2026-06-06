const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/db');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { sendEmail } = require('../utils/notifications');

async function register(req, res) {
  const { email, password, first_name, last_name, phone } = req.body;

  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return error(res, 'Email already registered', 409);
  }

  const roles = await query("SELECT id FROM roles WHERE name = 'Customer'");
  const password_hash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [roles[0].id, email, password_hash, first_name, last_name, phone || null]
  );

  const token = signToken({ userId: result.insertId });
  const user = await getUserById(result.insertId);

  return success(res, { user, token }, 'Registration successful', 201);
}

async function login(req, res) {
  const { email, password } = req.body;

  const users = await query(
    `SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`,
    [email]
  );

  if (!users.length) {
    return error(res, 'Invalid email or password', 401);
  }

  const user = users[0];
  if (!user.is_active) {
    return error(res, 'Account is deactivated', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return error(res, 'Invalid email or password', 401);
  }

  const token = signToken({ userId: user.id });
  const safeUser = sanitizeUser(user);

  return success(res, { user: safeUser, token }, 'Login successful');
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  const users = await query('SELECT id, email, first_name FROM users WHERE email = ?', [email]);
  if (!users.length) {
    return success(res, null, 'If the email exists, a reset link has been sent');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000);

  await query(
    'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
    [resetToken, expires, users[0].id]
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = `
    <h2>Password Reset</h2>
    <p>Dear ${users[0].first_name},</p>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <p><a href="${resetUrl}">Reset Password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  await sendEmail(users[0].email, 'Password Reset Request', html);

  if (process.env.NODE_ENV === 'development') {
    console.log(`Password reset link for ${email}: ${resetUrl}`);
  }

  return success(res, { resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined }, 'If the email exists, a reset link has been sent');
}

async function resetPassword(req, res) {
  const { token, password } = req.body;

  const users = await query(
    'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
    [token]
  );

  if (!users.length) {
    return error(res, 'Invalid or expired reset token', 400);
  }

  const password_hash = await bcrypt.hash(password, 12);
  await query(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
    [password_hash, users[0].id]
  );

  return success(res, null, 'Password reset successful');
}

async function getProfile(req, res) {
  const user = await getUserById(req.user.id);
  return success(res, user);
}

async function updateProfile(req, res) {
  const { first_name, last_name, phone, avatar_url } = req.body;

  await query(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, avatar_url = ? WHERE id = ?',
    [first_name, last_name, phone || null, avatar_url || null, req.user.id]
  );

  const user = await getUserById(req.user.id);
  return success(res, user, 'Profile updated');
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  const users = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const valid = await bcrypt.compare(current_password, users[0].password_hash);

  if (!valid) {
    return error(res, 'Current password is incorrect', 400);
  }

  const password_hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);

  return success(res, null, 'Password changed successfully');
}

async function getUserById(id) {
  const users = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active, r.name as role, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [id]
  );
  return users[0] || null;
}

function sanitizeUser(user) {
  const { password_hash, reset_token, reset_token_expires, role_id, ...safe } = user;
  return safe;
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
};
