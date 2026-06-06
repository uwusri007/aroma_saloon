# Aroma Ladies Salon - Online Booking System

A full-stack online booking platform for a ladies salon with customer booking, PayPal deposit payments, and a comprehensive admin panel.

## Projects

| Project          | Description                    | Port |
|------------------|--------------------------------|------|
| `salon-backend`  | Node.js/Express REST API       | 5000 |
| `salon-frontend` | Next.js web application        | 3000 |

## Features

- Customer registration, login, forgot password, profile management
- Treatment catalog with categories, pricing, and duration
- Multi-step appointment booking with slot availability
- 10% PayPal deposit to confirm appointments
- Admin panel for treatments, staff, working hours, holidays, appointments, customers, payments
- Staff availability and double-booking prevention
- Treatment suggestions based on booking history
- Email and in-app notifications

## Quick Start

### 1. Backend (Docker: MySQL + MailHog, API runs locally)

```bash
cd salon-backend
npm install
cp .env.example .env
npm run docker:up
npm run db:setup
npm run dev
```

- API: http://localhost:5000/api/health
- MailHog inbox: http://localhost:8026

### 2. Frontend

```bash
cd salon-frontend
npm install
cp .env.example .env.local
npm run dev
```

### 3. Open the app

- Frontend: http://localhost:3000
- API health: http://localhost:5000/api/health

## Default Accounts

| Role     | Email                | Password     |
|----------|----------------------|--------------|
| Admin    | admin@salon.com      | Admin@123    |
| Customer | customer@example.com | Customer@123 |

## PayPal Setup

1. Create a PayPal Developer account at https://developer.paypal.com
2. Create a Sandbox app to get Client ID and Secret
3. Add credentials to `salon-backend/.env`:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_MODE=sandbox`

## Database

MySQL schema includes: users, roles, treatment_categories, treatments, staff, staff_treatments, working_hours, holidays, appointments, appointment_treatments, payments, notifications, salon_settings, treatment_suggestions.

Run migrations: `npm run db:migrate` (in salon-backend)
Run seed data: `npm run db:seed` (in salon-backend)

## License

MIT
