const { query, getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/response');
const { getAppointmentDetails } = require('./appointment.controller');
const { checkSlotAvailability } = require('../utils/slotGenerator');

// --- Appointments ---
async function listAppointments(req, res) {
  const { status, date, customer_id } = req.query;
  let sql = `
    SELECT a.*, s.name as staff_name, u.first_name as customer_first_name, u.last_name as customer_last_name, u.email as customer_email
    FROM appointments a
    LEFT JOIN staff s ON a.staff_id = s.id
    JOIN users u ON a.customer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (date) { sql += ' AND a.appointment_date = ?'; params.push(date); }
  if (customer_id) { sql += ' AND a.customer_id = ?'; params.push(customer_id); }

  sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
  const appointments = await query(sql, params);
  return success(res, appointments);
}

async function updateAppointmentStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['Pending Payment', 'Confirmed', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return error(res, 'Invalid status', 400);
  }

  await query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
  const appointment = await getAppointmentDetails(req.params.id);
  return success(res, appointment, 'Appointment status updated');
}

async function updateAppointment(req, res) {
  const { staff_id, appointment_date, start_time, notes, status } = req.body;
  const appointment = await getAppointmentDetails(req.params.id);
  if (!appointment) return error(res, 'Appointment not found', 404);

  if (appointment_date && start_time && staff_id) {
    const slotCheck = await checkSlotAvailability(
      appointment_date,
      start_time,
      appointment.total_duration_minutes,
      staff_id,
      req.params.id
    );
    if (!slotCheck.available) {
      return error(res, slotCheck.reason, 409);
    }

    await query(
      'UPDATE appointments SET staff_id = ?, appointment_date = ?, start_time = ?, end_time = ?, notes = COALESCE(?, notes), status = COALESCE(?, status) WHERE id = ?',
      [staff_id, appointment_date, start_time, slotCheck.endTime, notes, status, req.params.id]
    );
  } else {
    await query(
      'UPDATE appointments SET notes = COALESCE(?, notes), status = COALESCE(?, status) WHERE id = ?',
      [notes, status, req.params.id]
    );
  }

  const updated = await getAppointmentDetails(req.params.id);
  return success(res, updated, 'Appointment updated');
}

// --- Customers ---
async function listCustomers(req, res) {
  const customers = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM appointments a WHERE a.customer_id = u.id) as appointment_count
     FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Customer'
     ORDER BY u.created_at DESC`
  );
  return success(res, customers);
}

async function getCustomer(req, res) {
  const customers = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND r.name = 'Customer'`,
    [req.params.id]
  );
  if (!customers.length) return error(res, 'Customer not found', 404);

  const appointments = await query(
    'SELECT * FROM appointments WHERE customer_id = ? ORDER BY appointment_date DESC',
    [req.params.id]
  );

  return success(res, { ...customers[0], appointments });
}

async function toggleCustomerStatus(req, res) {
  await query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  const user = await query('SELECT id, email, is_active FROM users WHERE id = ?', [req.params.id]);
  return success(res, user[0], 'Customer status updated');
}

// --- Staff ---
async function listStaff(req, res) {
  const staff = await query('SELECT * FROM staff ORDER BY name');
  return success(res, staff);
}

async function getStaffMember(req, res) {
  const staff = await query('SELECT * FROM staff WHERE id = ?', [req.params.id]);
  if (!staff.length) return error(res, 'Staff not found', 404);

  const treatments = await query(
    `SELECT t.* FROM staff_treatments st JOIN treatments t ON st.treatment_id = t.id WHERE st.staff_id = ?`,
    [req.params.id]
  );

  return success(res, { ...staff[0], treatments });
}

async function createStaff(req, res) {
  const { name, email, phone, bio, avatar_url, treatment_ids, is_active } = req.body;
  const conn = await getConnection();

  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO staff (name, email, phone, bio, avatar_url, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email || null, phone || null, bio || null, avatar_url || null, is_active !== false]
    );

    if (treatment_ids?.length) {
      for (const tid of treatment_ids) {
        await conn.execute('INSERT INTO staff_treatments (staff_id, treatment_id) VALUES (?, ?)', [result.insertId, tid]);
      }
    }

    await conn.commit();
    const staffMember = await getStaffMemberData(result.insertId);
    return success(res, staffMember, 'Staff created', 201);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function updateStaff(req, res) {
  const { name, email, phone, bio, avatar_url, treatment_ids, is_active } = req.body;
  const conn = await getConnection();

  try {
    await conn.beginTransaction();
    await conn.execute(
      'UPDATE staff SET name = ?, email = ?, phone = ?, bio = ?, avatar_url = ?, is_active = ? WHERE id = ?',
      [name, email || null, phone || null, bio || null, avatar_url || null, is_active !== false, req.params.id]
    );

    if (treatment_ids) {
      await conn.execute('DELETE FROM staff_treatments WHERE staff_id = ?', [req.params.id]);
      for (const tid of treatment_ids) {
        await conn.execute('INSERT INTO staff_treatments (staff_id, treatment_id) VALUES (?, ?)', [req.params.id, tid]);
      }
    }

    await conn.commit();
    const staff = await getStaffMemberData(req.params.id);
    return success(res, staff, 'Staff updated');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function deleteStaff(req, res) {
  await query('DELETE FROM staff WHERE id = ?', [req.params.id]);
  return success(res, null, 'Staff deleted');
}

async function getStaffMemberData(id) {
  const staff = await query('SELECT * FROM staff WHERE id = ?', [id]);
  const treatments = await query(
    `SELECT t.id, t.name FROM staff_treatments st JOIN treatments t ON st.treatment_id = t.id WHERE st.staff_id = ?`,
    [id]
  );
  return { ...staff[0], treatments };
}

// --- Working Hours ---
async function getWorkingHours(req, res) {
  const hours = await query('SELECT * FROM working_hours ORDER BY day_of_week');
  return success(res, hours);
}

async function updateWorkingHours(req, res) {
  const { hours } = req.body;

  for (const h of hours) {
    await query(
      `INSERT INTO working_hours (day_of_week, open_time, close_time, is_closed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE open_time = VALUES(open_time), close_time = VALUES(close_time), is_closed = VALUES(is_closed)`,
      [h.day_of_week, h.open_time, h.close_time, h.is_closed || false]
    );
  }

  const updated = await query('SELECT * FROM working_hours ORDER BY day_of_week');
  return success(res, updated, 'Working hours updated');
}

// --- Holidays ---
async function listHolidays(req, res) {
  const holidays = await query('SELECT * FROM holidays ORDER BY date');
  return success(res, holidays);
}

async function createHoliday(req, res) {
  const { date, reason } = req.body;
  const result = await query('INSERT INTO holidays (date, reason) VALUES (?, ?)', [date, reason || null]);
  const holiday = await query('SELECT * FROM holidays WHERE id = ?', [result.insertId]);
  return success(res, holiday[0], 'Holiday added', 201);
}

async function deleteHoliday(req, res) {
  await query('DELETE FROM holidays WHERE id = ?', [req.params.id]);
  return success(res, null, 'Holiday removed');
}

// --- Settings ---
async function getSettings(req, res) {
  const settings = await query('SELECT * FROM salon_settings');
  const map = {};
  settings.forEach((s) => { map[s.setting_key] = s.setting_value; });
  return success(res, map);
}

async function updateSettings(req, res) {
  const settings = req.body;
  for (const [key, value] of Object.entries(settings)) {
    await query(
      `INSERT INTO salon_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );
  }
  const updated = await query('SELECT * FROM salon_settings');
  const map = {};
  updated.forEach((s) => { map[s.setting_key] = s.setting_value; });
  return success(res, map, 'Settings updated');
}

// --- Notifications ---
async function listNotifications(req, res) {
  const notifications = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50',
    [req.user.id]
  );
  return success(res, notifications);
}

async function markNotificationRead(req, res) {
  await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  return success(res, null, 'Notification marked as read');
}

// --- Dashboard stats ---
async function getDashboardStats(req, res) {
  const [todayAppointments] = await query(
    "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE() AND status IN ('Confirmed', 'Pending Payment')"
  );
  const [totalCustomers] = await query(
    "SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Customer'"
  );
  const [pendingPayments] = await query(
    "SELECT COUNT(*) as count FROM appointments WHERE status = 'Pending Payment'"
  );
  const [monthRevenue] = await query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND MONTH(created_at) = MONTH(CURDATE())"
  );
  const recentAppointments = await query(
    `SELECT a.*, u.first_name, u.last_name FROM appointments a
     JOIN users u ON a.customer_id = u.id ORDER BY a.created_at DESC LIMIT 10`
  );

  return success(res, {
    todayAppointments: todayAppointments.count,
    totalCustomers: totalCustomers.count,
    pendingPayments: pendingPayments.count,
    monthRevenue: monthRevenue.total,
    recentAppointments,
  });
}

// --- Treatment suggestions admin ---
async function setTreatmentSuggestions(req, res) {
  const { treatment_id, suggested_treatment_ids } = req.body;

  await query('DELETE FROM treatment_suggestions WHERE treatment_id = ?', [treatment_id]);
  for (const sid of suggested_treatment_ids || []) {
    await query('INSERT INTO treatment_suggestions (treatment_id, suggested_treatment_id) VALUES (?, ?)', [treatment_id, sid]);
  }

  return success(res, null, 'Suggestions updated');
}

module.exports = {
  listAppointments,
  updateAppointmentStatus,
  updateAppointment,
  listCustomers,
  getCustomer,
  toggleCustomerStatus,
  listStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  getWorkingHours,
  updateWorkingHours,
  listHolidays,
  createHoliday,
  deleteHoliday,
  getSettings,
  updateSettings,
  listNotifications,
  markNotificationRead,
  getDashboardStats,
  setTreatmentSuggestions,
};
