require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const skipCodes = new Set([
    'ER_DUP_KEYNAME',   // index already exists
    'ER_TABLE_EXISTS_ERROR', // table already exists (without IF NOT EXISTS)
    'ER_DUP_FIELDNAME', // duplicate column on ALTER
  ]);

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        if (skipCodes.has(err.code)) {
          console.log(`Skipping (already applied): ${statement.slice(0, 80)}...`);
          continue;
        }
        throw err;
      }
    }

    console.log('Database migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
