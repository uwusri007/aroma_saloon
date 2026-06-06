set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
node <<'EOF'
const mysql = require('mysql2/promise');

async function waitForMySQL() {
  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'mysql',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      await connection.ping();
      await connection.end();
      console.log('MySQL is ready.');
      return;
    } catch (err) {
      console.log(`Attempt ${attempt}/${maxAttempts}: MySQL not ready yet...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  console.error('MySQL did not become ready in time.');
  process.exit(1);
}

waitForMySQL();
EOF

echo "Running database migration..."
node database/migrate.js

echo "Running database seed..."
node database/seed.js

echo "Starting Salon API in dev mode..."
exec npm run dev
