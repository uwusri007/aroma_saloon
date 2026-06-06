const nodemailer = require('nodemailer');
const { query } = require('../config/db');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    return null;
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
  };

  if (process.env.SMTP_USER) {
    config.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  transporter = nodemailer.createTransport(config);

  return transporter;
}

async function createNotification(userId, type, title, message, appointmentId = null) {
  await query(
    `INSERT INTO notifications (user_id, appointment_id, type, title, message) VALUES (?, ?, ?, ?, ?)`,
    [userId, appointmentId, type, title, message]
  );
}

async function sendEmail(to, subject, html) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[Email skipped] To: ${to}, Subject: ${subject}`);
    return false;
  }

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

async function sendAppointmentConfirmation(user, appointment) {
  const title = 'Appointment Confirmed';
  const message = `Your appointment on ${appointment.appointment_date} at ${appointment.start_time} has been confirmed.`;
  await createNotification(user.id, 'confirmation', title, message, appointment.id);

  const html = `
    <h2>Appointment Confirmed</h2>
    <p>Dear ${user.first_name},</p>
    <p>Your salon appointment has been confirmed.</p>
    <ul>
      <li><strong>Date:</strong> ${appointment.appointment_date}</li>
      <li><strong>Time:</strong> ${appointment.start_time} - ${appointment.end_time}</li>
      <li><strong>Total:</strong> $${appointment.total_price}</li>
      <li><strong>Deposit Paid:</strong> $${appointment.deposit_amount}</li>
    </ul>
    <p>We look forward to seeing you!</p>
  `;

  await sendEmail(user.email, title, html);
}

async function sendAppointmentReminder(user, appointment) {
  const title = 'Appointment Reminder';
  const message = `Reminder: You have an appointment tomorrow at ${appointment.start_time}.`;
  await createNotification(user.id, 'reminder', title, message, appointment.id);

  const html = `
    <h2>Appointment Reminder</h2>
    <p>Dear ${user.first_name},</p>
    <p>This is a friendly reminder about your upcoming appointment.</p>
    <ul>
      <li><strong>Date:</strong> ${appointment.appointment_date}</li>
      <li><strong>Time:</strong> ${appointment.start_time}</li>
    </ul>
  `;

  await sendEmail(user.email, title, html);
}

async function sendTreatmentSuggestions(userId, suggestions) {
  if (!suggestions.length) return;

  const names = suggestions.map((s) => s.name).join(', ');
  const title = 'Recommended Treatments';
  const message = `Based on your recent booking, you might enjoy: ${names}`;
  await createNotification(userId, 'suggestion', title, message);
}

module.exports = {
  createNotification,
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendTreatmentSuggestions,
};
