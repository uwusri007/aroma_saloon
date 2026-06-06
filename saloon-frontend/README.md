# Salon Frontend

Next.js web application for the Aroma Ladies Salon online booking platform.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios
- React Hot Toast

## Prerequisites

- Node.js 18+
- Running salon-backend API

## Setup

1. Install dependencies:

```bash
cd salon-frontend
npm install
```

2. Copy environment file:

```bash
cp .env.example .env.local
```

Configure:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:5000/api`)
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - PayPal client ID (optional, for client-side integration)

3. Start development server:

```bash
npm run dev
```

App runs at `http://localhost:3000`

## Pages

### Customer
- `/` - Home page
- `/treatments` - Treatment listing
- `/treatments/[id]` - Treatment detail
- `/book` - Multi-step booking flow
- `/payment/[id]` - PayPal deposit payment
- `/dashboard` - Customer dashboard, appointments, profile
- `/login`, `/register`, `/forgot-password`, `/reset-password` - Auth

### Admin
- `/admin` - Dashboard with stats
- `/admin/appointments` - Manage appointments
- `/admin/treatments` - CRUD treatments
- `/admin/categories` - CRUD categories
- `/admin/staff` - Manage staff and treatment assignments
- `/admin/customers` - View customers
- `/admin/working-hours` - Configure salon hours
- `/admin/holidays` - Manage closed dates
- `/admin/payments` - Payment records
- `/admin/settings` - Salon settings

## Default Login

Use admin credentials from backend seed data to access the admin panel:
- Email: `admin@salon.com`
- Password: `Admin@123`

## Build for Production

```bash
npm run build
npm start
```
