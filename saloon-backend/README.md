# Salon Backend API

REST API for the Aroma Ladies Salon online booking platform.

## Tech Stack

- Node.js + Express
- MySQL
- JWT authentication
- PayPal Checkout SDK
- Role-based access control (Admin, Customer, Staff)

## Prerequisites

- Node.js 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for MySQL and MailHog)

## Development setup

Docker runs **MySQL** and **MailHog** only. The API runs locally with nodemon.

### 1. Start MySQL and MailHog

```bash
cd salon-backend
npm run docker:up
```

| Service | URL / connection |
|---------|------------------|
| MySQL | `localhost:3307` (user: `root`, password: `salon_root_pass`) |
| MailHog inbox | http://localhost:8026 |
| MailHog SMTP | `localhost:1026` |

### 2. Configure environment

```bash
cp .env.example .env
```

`.env.example` is already set for local API + Docker MySQL/MailHog. Edit PayPal credentials if needed.

### 3. Install dependencies and set up the database (first time)

```bash
npm install
npm run db:setup
```

### 4. Start the API locally

```bash
npm run dev
```

API runs at http://localhost:5000

Verify:

```bash
curl http://localhost:5000/api/health
```

**Frontend connection:** set in `salon-frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Troubleshooting

**MySQL access denied:** If you changed `DB_PASSWORD` after MySQL was first created, the old password is stored in the Docker volume. Either restore the original password in `.env`, or reset the database:

```bash
npm run docker:down
docker volume rm saloon-backend_salon_mysql_data
npm run docker:up
npm run db:setup
```

### Useful commands

```bash
npm run docker:logs     # follow MySQL / MailHog logs
npm run docker:down     # stop Docker containers
npm run docker:restart  # restart MySQL and MailHog
npm run db:migrate      # run migrations
npm run db:seed         # seed sample data
```

### Docker environment variables

Configure in `.env` (read by `docker-compose.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `salon_root_pass` | MySQL root password |
| `DB_NAME` | `salon_booking` | Database name |
| `DB_HOST_PORT` | `3307` | MySQL port on your machine |
| `MAILHOG_SMTP_PORT` | `1026` | MailHog SMTP port on your machine |
| `MAILHOG_UI_PORT` | `8026` | MailHog web UI port on your machine |

### Email testing (MailHog)

1. Ensure Docker is running (`npm run docker:up`).
2. Start the API (`npm run dev`).
3. Open http://localhost:8026 to view captured emails.
4. Trigger an email, e.g. forgot password:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"customer@example.com\"}"
```

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

- `npm run dev` - Start API with nodemon (local)
- `npm run db:migrate` - Run database migration
- `npm run db:seed` - Seed sample data
- `npm run db:setup` - Migrate + seed
- `npm run docker:up` - Start MySQL and MailHog in Docker
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View MySQL and MailHog logs
