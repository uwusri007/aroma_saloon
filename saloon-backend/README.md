# Salon Backend API

REST API for the Aroma Ladies Salon online booking platform.

## Tech Stack

- Node.js + Express
- MySQL
- JWT authentication
- PayPal Checkout SDK
- Role-based access control (Admin, Customer, Staff)

## Prerequisites

- Node.js 18+ and MySQL 8+ (for local setup), **or**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)

## Run with Docker Desktop (recommended)

1. Open **Docker Desktop** and ensure it is running.

2. From the `salon-backend` folder, copy env file (optional — defaults work for local Docker):

```bash
cp .env.example .env
```

3. Start MySQL + API:

```bash
docker compose up --build -d
```

Or use npm script:

```bash
npm run docker:up
```

4. Verify the API:

```bash
curl http://localhost:5000/api/health
```

| Service | URL |
|---------|-----|
| API | http://localhost:5000 |
| MySQL (host access) | `localhost:3307` |

**Useful commands:**

```bash
npm run docker:logs    # follow API logs
npm run docker:down    # stop containers
npm run docker:restart # rebuild and restart
```

Docker automatically runs database migration and seed on startup.

**Frontend connection:** set in `salon-frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Docker environment variables

Configure in `.env` (read by `docker-compose.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `salon_root_pass` | MySQL root password |
| `DB_NAME` | `salon_booking` | Database name |
| `DB_HOST_PORT` | `3307` | MySQL port on your machine |
| `PORT` | `5000` | API port |
| `JWT_SECRET` | (change in prod) | JWT signing key |
| `FRONTEND_URL` | `http://localhost:3000` | CORS / email links |
| `PAYPAL_CLIENT_ID` | — | PayPal sandbox client ID |
| `PAYPAL_CLIENT_SECRET` | — | PayPal sandbox secret |

## Local Setup (without Docker)

1. Install dependencies:

```bash
cd salon-backend
npm install
```

2. Copy environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials, JWT secret, and PayPal sandbox credentials.

3. Create database and run migrations + seed:

```bash
npm run db:setup
```

4. Start the development server:

```bash
npm run dev
```

API runs at `http://localhost:5000`

## Default Seed Credentials

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Admin    | admin@salon.com        | Admin@123     |
| Customer | customer@example.com   | Customer@123  |

## API Endpoints

### Auth
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get profile (auth)
- `PUT /api/auth/profile` - Update profile (auth)

### Treatments
- `GET /api/treatments/categories` - List categories
- `GET /api/treatments` - List treatments
- `GET /api/treatments/:id` - Get treatment with suggestions
- Admin CRUD on `/api/treatments` and `/api/treatments/categories`

### Appointments
- `GET /api/appointments/slots?date=&treatment_ids=` - Available time slots
- `POST /api/appointments/calculate` - Calculate totals
- `POST /api/appointments` - Create appointment (auth)
- `GET /api/appointments/my` - Customer appointments (auth)
- `GET /api/appointments/suggestions` - Treatment suggestions (auth)

### Payments
- `POST /api/payments/create-order` - Create PayPal order (auth)
- `POST /api/payments/capture` - Capture payment (auth)
- `POST /api/payments/webhook` - PayPal webhook

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- Full CRUD for appointments, customers, staff, working hours, holidays, settings

## Business Rules

- Appointments require 10% deposit via PayPal to confirm
- Slot generation considers working hours, holidays, staff availability, and existing bookings
- Overlapping appointments are prevented based on treatment duration

## Scripts

- `npm run dev` - Start with nodemon
- `npm run db:migrate` - Run database migration
- `npm run db:seed` - Seed sample data
- `npm run db:setup` - Migrate + seed
- `npm run docker:up` - Start with Docker Desktop
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View API container logs
