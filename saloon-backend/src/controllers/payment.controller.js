const { query, getConnection } = require('../config/db');
const { success, error } = require('../utils/response');
const paypalService = require('../services/paypal.service');
const { getAppointmentDetails } = require('./appointment.controller');
const { sendAppointmentConfirmation } = require('../utils/notifications');

async function createPayPalOrder(req, res) {
  const { appointment_id } = req.body;

  const appointment = await getAppointmentDetails(appointment_id);
  if (!appointment) return error(res, 'Appointment not found', 404);

  if (req.user.role === 'Customer' && appointment.customer_id !== req.user.id) {
    return error(res, 'Access denied', 403);
  }

  if (appointment.status !== 'Pending Payment') {
    return error(res, 'Appointment is not awaiting payment', 400);
  }

  const existingPayment = await query(
    "SELECT * FROM payments WHERE appointment_id = ? AND status = 'completed'",
    [appointment_id]
  );
  if (existingPayment.length) {
    return error(res, 'Deposit already paid', 400);
  }

  try {
    const order = await paypalService.createOrder(
      parseFloat(appointment.deposit_amount),
      'USD',
      `Salon deposit for appointment #${appointment_id}`
    );

    await query(
      `INSERT INTO payments (appointment_id, paypal_order_id, amount, status, payment_type)
       VALUES (?, ?, ?, 'pending', 'deposit')`,
      [appointment_id, order.id, appointment.deposit_amount]
    );

    const approveLink = order.links.find((l) => l.rel === 'approve')?.href;

    return success(res, {
      orderId: order.id,
      approveUrl: approveLink,
      amount: appointment.deposit_amount,
    });
  } catch (err) {
    console.error('PayPal create order error:', err);
    return error(res, 'Failed to create PayPal order', 500);
  }
}

async function capturePayment(req, res) {
  const { order_id, appointment_id } = req.body;

  const payments = await query(
    'SELECT * FROM payments WHERE paypal_order_id = ? AND appointment_id = ?',
    [order_id, appointment_id]
  );

  if (!payments.length) {
    return error(res, 'Payment record not found', 404);
  }

  const payment = payments[0];
  if (payment.status === 'completed') {
    const appointment = await getAppointmentDetails(appointment_id);
    return success(res, { appointment, payment }, 'Payment already completed');
  }

  try {
    const captureResult = await paypalService.captureOrder(order_id);
    const capture = captureResult.purchase_units[0]?.payments?.captures?.[0];

    if (!capture || capture.status !== 'COMPLETED') {
      await query("UPDATE payments SET status = 'failed', raw_response = ? WHERE id = ?", [
        JSON.stringify(captureResult),
        payment.id,
      ]);
      return error(res, 'Payment capture failed', 400);
    }

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        "UPDATE payments SET status = 'completed', paypal_capture_id = ?, raw_response = ? WHERE id = ?",
        [capture.id, JSON.stringify(captureResult), payment.id]
      );

      await conn.execute("UPDATE appointments SET status = 'Confirmed' WHERE id = ?", [appointment_id]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const appointment = await getAppointmentDetails(appointment_id);
    const users = await query('SELECT id, email, first_name FROM users WHERE id = ?', [appointment.customer_id]);
    if (users.length) {
      await sendAppointmentConfirmation(users[0], appointment);
    }

    const updatedPayment = await query('SELECT * FROM payments WHERE id = ?', [payment.id]);

    return success(res, { appointment, payment: updatedPayment[0] }, 'Payment successful. Appointment confirmed.');
  } catch (err) {
    console.error('PayPal capture error:', err);
    return error(res, 'Payment capture failed', 500);
  }
}

async function getPaymentHistory(req, res) {
  let sql = `
    SELECT p.*, a.appointment_date, a.start_time, a.status as appointment_status
    FROM payments p
    JOIN appointments a ON p.appointment_id = a.id
  `;
  const params = [];

  if (req.user.role === 'Customer') {
    sql += ' WHERE a.customer_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY p.created_at DESC';
  const payments = await query(sql, params);
  return success(res, payments);
}

async function paypalWebhook(req, res) {
  const event = req.body;
  console.log('PayPal webhook received:', event.event_type);

  if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource;
    const orderId = resource.id || resource.supplementary_data?.related_ids?.order_id;

    if (orderId) {
      const payments = await query('SELECT * FROM payments WHERE paypal_order_id = ?', [orderId]);
      if (payments.length && payments[0].status !== 'completed') {
        console.log(`Webhook: payment ${orderId} approved/completed`);
      }
    }
  }

  return res.status(200).json({ received: true });
}

module.exports = {
  createPayPalOrder,
  capturePayment,
  getPaymentHistory,
  paypalWebhook,
};
