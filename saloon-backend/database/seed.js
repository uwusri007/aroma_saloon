require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'salon_booking',
  });

  try {
    console.log('Seeding database...');

    await connection.execute('INSERT IGNORE INTO roles (id, name) VALUES (1, "Admin"), (2, "Customer"), (3, "Staff")');

    const adminHash = await bcrypt.hash('Admin@123', 12);
    await connection.execute(
      `INSERT IGNORE INTO users (id, role_id, email, password_hash, first_name, last_name, phone)
       VALUES (1, 1, 'admin@salon.com', ?, 'Salon', 'Admin', '555-0100')`,
      [adminHash]
    );

    const customerHash = await bcrypt.hash('Customer@123', 12);
    await connection.execute(
      `INSERT IGNORE INTO users (id, role_id, email, password_hash, first_name, last_name, phone)
       VALUES (2, 2, 'customer@example.com', ?, 'Jane', 'Doe', '555-0200')`,
      [customerHash]
    );

    const categories = [
      [1, 'Hair Services', 'Professional haircuts, styling, and treatments', 1],
      [2, 'Skin & Facial', 'Rejuvenating facials and skin care', 2],
      [3, 'Threading & Waxing', 'Precision threading and waxing services', 3],
      [4, 'Bridal & Makeup', 'Bridal packages and professional makeup', 4],
      [5, 'Nail Care', 'Manicure, pedicure, and nail art', 5],
    ];

    for (const [id, name, desc, order] of categories) {
      await connection.execute(
        'INSERT IGNORE INTO treatment_categories (id, name, description, sort_order) VALUES (?, ?, ?, ?)',
        [id, name, desc, order]
      );
    }

    const treatments = [
      [1, 1, 'Classic Haircut', 'Precision cut with wash and blow dry', 45, 35.00],
      [2, 1, 'Hair Coloring', 'Full head color with premium products', 120, 85.00],
      [3, 1, 'Hair Spa', 'Deep conditioning spa treatment', 60, 55.00],
      [4, 1, 'Keratin Treatment', 'Smoothing keratin treatment', 150, 150.00],
      [5, 2, 'Classic Facial', 'Deep cleansing and hydrating facial', 60, 45.00],
      [6, 2, 'Gold Facial', 'Luxury gold-infused facial treatment', 75, 75.00],
      [7, 2, 'Cleanup', 'Quick refresh facial cleanup', 30, 25.00],
      [8, 3, 'Eyebrow Threading', 'Precision eyebrow shaping', 15, 12.00],
      [9, 3, 'Full Face Threading', 'Complete facial hair removal', 30, 25.00],
      [10, 3, 'Upper Lip Threading', 'Quick upper lip threading', 10, 8.00],
      [11, 4, 'Bridal Makeup', 'Complete bridal makeup package', 180, 250.00],
      [12, 4, 'Party Makeup', 'Glamorous party makeup look', 90, 75.00],
      [13, 4, 'Bridal Trial', 'Bridal makeup trial session', 90, 100.00],
      [14, 5, 'Classic Manicure', 'Nail shaping, cuticle care, and polish', 45, 30.00],
      [15, 5, 'Spa Pedicure', 'Relaxing spa pedicure treatment', 60, 45.00],
    ];

    for (const [id, catId, name, desc, duration, price] of treatments) {
      await connection.execute(
        'INSERT IGNORE INTO treatments (id, category_id, name, description, duration_minutes, price) VALUES (?, ?, ?, ?, ?, ?)',
        [id, catId, name, desc, duration, price]
      );
    }

    const staff = [
      [1, 'Priya Sharma', 'priya@salon.com', '555-1001', 'Senior stylist with 10+ years experience'],
      [2, 'Anita Patel', 'anita@salon.com', '555-1002', 'Facial and skin care specialist'],
      [3, 'Meera Singh', 'meera@salon.com', '555-1003', 'Bridal makeup artist'],
      [4, 'Kavita Reddy', 'kavita@salon.com', '555-1004', 'Threading and waxing expert'],
    ];

    for (const [id, name, email, phone, bio] of staff) {
      await connection.execute(
        'INSERT IGNORE INTO staff (id, name, email, phone, bio) VALUES (?, ?, ?, ?, ?)',
        [id, name, email, phone, bio]
      );
    }

    const staffTreatments = [
      [1, 1], [1, 2], [1, 3], [1, 4],
      [2, 5], [2, 6], [2, 7],
      [3, 11], [3, 12], [3, 13],
      [4, 8], [4, 9], [4, 10], [4, 14], [4, 15],
      [1, 14], [2, 7], [3, 12],
    ];

    for (const [staffId, treatmentId] of staffTreatments) {
      await connection.execute(
        'INSERT IGNORE INTO staff_treatments (staff_id, treatment_id) VALUES (?, ?)',
        [staffId, treatmentId]
      );
    }

    const workingHours = [
      [0, '10:00:00', '18:00:00', true],
      [1, '09:00:00', '19:00:00', false],
      [2, '09:00:00', '19:00:00', false],
      [3, '09:00:00', '19:00:00', false],
      [4, '09:00:00', '19:00:00', false],
      [5, '09:00:00', '20:00:00', false],
      [6, '09:00:00', '20:00:00', false],
    ];

    for (const [day, open, close, closed] of workingHours) {
      await connection.execute(
        'INSERT IGNORE INTO working_hours (day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?)',
        [day, open, close, closed]
      );
    }

    const suggestions = [
      [5, 7], [5, 9], [5, 8],
      [1, 3], [1, 2],
      [7, 5], [7, 8],
      [2, 3], [2, 4],
      [11, 13], [11, 12],
    ];

    for (const [tid, sid] of suggestions) {
      await connection.execute(
        'INSERT IGNORE INTO treatment_suggestions (treatment_id, suggested_treatment_id) VALUES (?, ?)',
        [tid, sid]
      );
    }

    const settings = [
      ['salon_name', 'Aroma Ladies Salon'],
      ['salon_tagline', 'Where Beauty Meets Elegance'],
      ['salon_address', '123 Beauty Lane, City Center'],
      ['salon_phone', '555-SALON'],
      ['salon_email', 'info@aromasalon.com'],
      ['deposit_percent', '10'],
      ['slot_interval_minutes', '15'],
      ['currency', 'USD'],
    ];

    for (const [key, value] of settings) {
      await connection.execute(
        'INSERT IGNORE INTO salon_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }

    console.log('Seed data inserted successfully.');
    console.log('');
    console.log('Default credentials:');
    console.log('  Admin:    admin@salon.com / Admin@123');
    console.log('  Customer: customer@example.com / Customer@123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
