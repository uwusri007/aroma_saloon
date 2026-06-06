const { query } = require('../config/db');

function normalizeDateString(dateInput) {
  if (!dateInput) return dateInput;
  if (typeof dateInput === 'string') {
    return dateInput.split('T')[0];
  }
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }
  return String(dateInput).split('T')[0];
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function timesOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

async function getWorkingHoursForDate(dateStr) {
  const normalizedDate = normalizeDateString(dateStr);
  const date = new Date(`${normalizedDate}T00:00:00`);
  const dayOfWeek = date.getDay();

  const hours = await query(
    'SELECT * FROM working_hours WHERE day_of_week = ?',
    [dayOfWeek]
  );

  if (!hours.length || hours[0].is_closed) {
    return null;
  }

  return hours[0];
}

async function isHoliday(dateStr) {
  const holidays = await query('SELECT id FROM holidays WHERE date = ?', [normalizeDateString(dateStr)]);
  return holidays.length > 0;
}

async function getStaffForTreatments(treatmentIds) {
  if (!treatmentIds.length) return [];

  const placeholders = treatmentIds.map(() => '?').join(',');
  const staff = await query(
    `SELECT s.* FROM staff s
     WHERE s.is_active = TRUE
     AND (
       SELECT COUNT(DISTINCT st.treatment_id)
       FROM staff_treatments st
       WHERE st.staff_id = s.id AND st.treatment_id IN (${placeholders})
     ) = ?`,
    [...treatmentIds, treatmentIds.length]
  );

  return staff;
}

async function getExistingAppointments(dateStr, staffId = null) {
  let sql = `
    SELECT id, staff_id, start_time, end_time, status
    FROM appointments
    WHERE appointment_date = ?
    AND status IN ('Pending Payment', 'Confirmed')
  `;
  const params = [normalizeDateString(dateStr)];

  if (staffId) {
    sql += ' AND staff_id = ?';
    params.push(staffId);
  }

  return query(sql, params);
}

async function generateAvailableSlots(dateStr, durationMinutes, treatmentIds) {
  if (await isHoliday(dateStr)) {
    return { slots: [], staff: [] };
  }

  const workingHours = await getWorkingHoursForDate(dateStr);
  if (!workingHours) {
    return { slots: [], staff: [] };
  }

  const staffMembers = await getStaffForTreatments(treatmentIds);
  if (!staffMembers.length) {
    return { slots: [], staff: [] };
  }

  const openMinutes = timeToMinutes(workingHours.open_time);
  const closeMinutes = timeToMinutes(workingHours.close_time);
  const slotInterval = 15;
  const allSlots = new Map();

  for (const staff of staffMembers) {
    const existing = await getExistingAppointments(dateStr, staff.id);

    for (let start = openMinutes; start + durationMinutes <= closeMinutes; start += slotInterval) {
      const end = start + durationMinutes;
      const startTime = minutesToTime(start);
      const endTime = minutesToTime(end);

      const hasConflict = existing.some((apt) =>
        timesOverlap(startTime, endTime, apt.start_time, apt.end_time)
      );

      if (!hasConflict) {
        const key = startTime;
        if (!allSlots.has(key)) {
          allSlots.set(key, {
            startTime,
            endTime,
            availableStaff: [],
          });
        }
        allSlots.get(key).availableStaff.push({
          id: staff.id,
          name: staff.name,
        });
      }
    }
  }

  const slots = Array.from(allSlots.values()).sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  return { slots, staff: staffMembers };
}

async function checkSlotAvailability(dateStr, startTime, durationMinutes, staffId, excludeAppointmentId = null) {
  const normalizedDate = normalizeDateString(dateStr);

  if (await isHoliday(normalizedDate)) {
    return { available: false, reason: 'Salon is closed on this date' };
  }

  const workingHours = await getWorkingHoursForDate(normalizedDate);
  if (!workingHours) {
    return { available: false, reason: 'Salon is closed on this day' };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const openMinutes = timeToMinutes(workingHours.open_time);
  const closeMinutes = timeToMinutes(workingHours.close_time);

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return { available: false, reason: 'Selected time is outside working hours' };
  }

  const endTime = minutesToTime(endMinutes);
  const startTimeFormatted = minutesToTime(startMinutes);

  let sql = `
    SELECT id FROM appointments
    WHERE appointment_date = ? AND staff_id = ?
    AND status IN ('Pending Payment', 'Confirmed')
    AND start_time < ? AND end_time > ?
  `;
  const params = [normalizedDate, staffId, endTime, startTimeFormatted];

  if (excludeAppointmentId) {
    sql += ' AND id != ?';
    params.push(excludeAppointmentId);
  }

  const conflicts = await query(sql, params);

  if (conflicts.length) {
    return { available: false, reason: 'Time slot is already booked' };
  }

  return { available: true, endTime: endTime };
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  timesOverlap,
  generateAvailableSlots,
  checkSlotAvailability,
  getStaffForTreatments,
  isHoliday,
  getWorkingHoursForDate,
};
