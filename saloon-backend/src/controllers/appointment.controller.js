const { query, getConnection } = require('../config/db');
const { success, error } = require('../utils/response');
const { generateAvailableSlots, checkSlotAvailability } = require('../utils/slotGenerator');
const { sendTreatmentSuggestions } = require('../utils/notifications');

const DEPOSIT_PERCENT = 0.1;

async function getAvailableSlots(req, res) {
  const { date, treatment_ids } = req.query;

  if (!date || !treatment_ids) {
    return error(res, 'Date and treatment_ids are required', 400);
  }

  const ids = treatment_ids.split(',').map(Number).filter(Boolean);
  if (!ids.length) {
    return error(res, 'At least one treatment is required', 400);
  }

  const treatments = await query(
    `SELECT id, duration_minutes FROM treatments WHERE id IN (${ids.map(() => '?').join(',')}) AND is_active = TRUE`,
    ids
  );

  if (treatments.length !== ids.length) {
    return error(res, 'One or more treatments not found', 404);
  }

  const totalDuration = treatments.reduce((sum, t) => sum + t.duration_minutes, 0);
  const result = await generateAvailableSlots(date, totalDuration, ids);

  return success(res, {
    date,
    totalDuration,
    slots: result.slots,
    availableStaff: result.staff,
  });
}

async function calculateBooking(req, res) {
  const { treatment_ids } = req.body;
  const ids = treatment_ids || [];

  if (!ids.length) {
    return error(res, 'At least one treatment is required', 400);
  }

  const treatments = await query(
    `SELECT t.*, tc.name as category_name FROM treatments t
     JOIN treatment_categories tc ON t.category_id = tc.id
     WHERE t.id IN (${ids.map(() => '?').join(',')}) AND t.is_active = TRUE`,
    ids
  );

  if (treatments.length !== ids.length) {
    return error(res, 'One or more treatments not found', 404);
  }

  const totalDuration = treatments.reduce((sum, t) => sum + t.duration_minutes, 0);
  const totalPrice = treatments.reduce((sum, t) => sum + parseFloat(t.price), 0);
  const depositAmount = Math.round(totalPrice * DEPOSIT_PERCENT * 100) / 100;

  return success(res, {
    treatments,
    totalDuration,
    totalPrice,
    depositAmount,
    depositPercent: DEPOSIT_PERCENT * 100,
  });
}

async function createAppointment(req, res) {
  const { treatment_ids, appointment_date, start_time, staff_id, notes } = req.body;
  const customerId = req.user.id;

  const ids = treatment_ids || [];
  if (!ids.length) {
    return error(res, 'At least one treatment is required', 400);
  }

  const treatments = await query(
    `SELECT * FROM treatments WHERE id IN (${ids.map(() => '?').join(',')}) AND is_active = TRUE`,
    ids
  );

  if (treatments.length !== ids.length) {
    return error(res, 'One or more treatments not found', 404);
  }

  const totalDuration = treatments.reduce((sum, t) => sum + t.duration_minutes, 0);
  const totalPrice = treatments.reduce((sum, t) => sum + parseFloat(t.price), 0);
  const depositAmount = Math.round(totalPrice * DEPOSIT_PERCENT * 100) / 100;

  const slotCheck = await checkSlotAvailability(appointment_date, start_time, totalDuration, staff_id);
  if (!slotCheck.available) {
    return error(res, slotCheck.reason, 409);
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [aptResult] = await conn.execute(
      `INSERT INTO appointments (customer_id, staff_id, appointment_date, start_time, end_time,
       total_duration_minutes, total_price, deposit_amount, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment', ?)`,
      [customerId, staff_id, appointment_date, start_time, slotCheck.endTime, totalDuration, totalPrice, depositAmount, notes || null]
    );

    const appointmentId = aptResult.insertId;

    for (const treatment of treatments) {
      await conn.execute(
        `INSERT INTO appointment_treatments (appointment_id, treatment_id, price, duration_minutes)
         VALUES (?, ?, ?, ?)`,
        [appointmentId, treatment.id, treatment.price, treatment.duration_minutes]
      );
    }

    await conn.commit();

    const appointment = await getAppointmentDetails(appointmentId);
    return success(res, appointment, 'Appointment created. Please complete deposit payment.', 201);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getMyAppointments(req, res) {
  const { status, upcoming } = req.query;
  let sql = `
    SELECT a.*, s.name as staff_name,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'name', t.name, 'price', at.price, 'duration_minutes', at.duration_minutes))
       FROM appointment_treatments at JOIN treatments t ON at.treatment_id = t.id
       WHERE at.appointment_id = a.id) as treatments
    FROM appointments a
    LEFT JOIN staff s ON a.staff_id = s.id
    WHERE a.customer_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (upcoming === 'true') {
    sql += " AND a.appointment_date >= CURDATE() AND a.status IN ('Pending Payment', 'Confirmed')";
  }
  if (upcoming === 'false') {
    sql += " AND (a.appointment_date < CURDATE() OR a.status IN ('Completed', 'Cancelled'))";
  }

  sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
  const appointments = await query(sql, params);

  const parsed = appointments.map((a) => ({
    ...a,
    treatments: typeof a.treatments === 'string' ? JSON.parse(a.treatments) : a.treatments || [],
  }));

  return success(res, parsed);
}

async function getAppointment(req, res) {
  const appointment = await getAppointmentDetails(req.params.id);
  if (!appointment) return error(res, 'Appointment not found', 404);

  if (req.user.role === 'Customer' && appointment.customer_id !== req.user.id) {
    return error(res, 'Access denied', 403);
  }

  return success(res, appointment);
}

async function cancelAppointment(req, res) {
  const appointment = await getAppointmentDetails(req.params.id);
  if (!appointment) return error(res, 'Appointment not found', 404);

  if (req.user.role === 'Customer' && appointment.customer_id !== req.user.id) {
    return error(res, 'Access denied', 403);
  }

  if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
    return error(res, 'Cannot cancel this appointment', 400);
  }

  await query("UPDATE appointments SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
  const updated = await getAppointmentDetails(req.params.id);
  return success(res, updated, 'Appointment cancelled');
}

async function getSuggestions(req, res) {
  const pastTreatments = await query(
    `SELECT DISTINCT at.treatment_id
     FROM appointment_treatments at
     JOIN appointments a ON at.appointment_id = a.id
     WHERE a.customer_id = ? AND a.status IN ('Confirmed', 'Completed')
     ORDER BY a.created_at DESC LIMIT 5`,
    [req.user.id]
  );

  if (!pastTreatments.length) {
    return success(res, []);
  }

  const treatmentIds = pastTreatments.map((t) => t.treatment_id);
  const placeholders = treatmentIds.map(() => '?').join(',');

  const suggestions = await query(
    `SELECT DISTINCT t.id, t.name, t.description, t.price, t.duration_minutes, t.image_url, tc.name as category_name
     FROM treatment_suggestions ts
     JOIN treatments t ON ts.suggested_treatment_id = t.id
     JOIN treatment_categories tc ON t.category_id = tc.id
     WHERE ts.treatment_id IN (${placeholders}) AND t.is_active = TRUE
     AND t.id NOT IN (${placeholders})
     LIMIT 6`,
    [...treatmentIds, ...treatmentIds]
  );

  await sendTreatmentSuggestions(req.user.id, suggestions);

  return success(res, suggestions);
}

async function getAppointmentDetails(id) {
  const appointments = await query(
    `SELECT a.*, s.name as staff_name,
      u.first_name as customer_first_name, u.last_name as customer_last_name, u.email as customer_email, u.phone as customer_phone
     FROM appointments a
     LEFT JOIN staff s ON a.staff_id = s.id
     JOIN users u ON a.customer_id = u.id
     WHERE a.id = ?`,
    [id]
  );

  if (!appointments.length) return null;

  const treatments = await query(
    `SELECT at.*, t.name, t.image_url FROM appointment_treatments at
     JOIN treatments t ON at.treatment_id = t.id WHERE at.appointment_id = ?`,
    [id]
  );

  const payments = await query('SELECT * FROM payments WHERE appointment_id = ? ORDER BY created_at DESC', [id]);

  return { ...appointments[0], treatments, payments };
}

module.exports = {
  getAvailableSlots,
  calculateBooking,
  createAppointment,
  getMyAppointments,
  getAppointment,
  cancelAppointment,
  getSuggestions,
  getAppointmentDetails,
};
