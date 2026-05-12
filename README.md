# LearnBee ERP

LearnBee ERP is a cloud-first school ERP and SaaS platform built with React, TypeScript, Vite, and Supabase. It combines a public marketing website with role-based dashboards for school operations such as student management, staff records, attendance, fees, notices, inventory, subscriptions, and marketplace modules.

## Overview

This repository contains:

- A React + TypeScript frontend powered by Vite
- Role-based dashboards for `super_admin`, `school_admin`, `teacher`, and staff roles
- Supabase Auth for authentication
- Supabase Edge Functions for backend business logic
- Optional Redis-backed caching inside edge functions
- Public landing pages and SaaS billing flows

## Main Features

- Public landing page with hero sections, pricing, demo pages, and contact flow
- School admin dashboard with students, teachers, staffs, fees, attendance, routine, results, inventory, payroll, and settings
- Super admin dashboard for schools, plans, subscriptions, and marketplace management
- Teacher dashboard for attendance, routine, results, notices, and settings
- Report card, ID card, QR code, and barcode-based document generation
- Subscription-gated staff access and school app marketplace support

## Tech Stack

- React 19
- TypeScript
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Three.js / React Three Fiber / Drei
- Supabase

## Project Structure

```text
learnbee/
├── src/
│   ├── components/        # Shared UI, layouts, route guards, landing sections
│   ├── contexts/          # Auth context
│   ├── hooks/             # Frontend ERP data hooks
│   ├── lib/               # Supabase client
│   ├── pages/             # Landing, admin, teacher, and super-admin pages
│   └── main.tsx           # App bootstrap
├── public/                # Static assets
├── supabase/
│   ├── functions/         # Edge Functions
│   ├── migrations/        # SQL migrations
│   └── config.toml        # Supabase config
├── .env.example           # Safe environment template
├── package.json
└── README.md
```

## Available Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your own keys locally
3. Do not commit `.env`

Minimal frontend variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_publishable_key
```

Server and edge function secrets should be configured in Supabase secrets or your deployment platform, not in Git.

## Local Development

### Frontend

```bash
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173` by default.

### Edge Functions

This project expects backend logic in `supabase/functions/`, including:

- `erp-academics`
- `mobile-api`
- `saas-platform`

Make sure the required environment variables are configured in Supabase before invoking those endpoints.

## Architecture

LearnBee follows a mostly decoupled frontend/backend pattern:

```text
Browser -> Supabase Auth -> Edge Functions -> Supabase Postgres
```

Key ideas:

- Frontend authentication uses Supabase sessions
- Most business logic runs through Edge Functions
- Role-based access is enforced with protected routes and layouts
- Billing, support, marketplace, and subscription logic live in the SaaS layer

## Key Routes

Public:

- `/`
- `/login`
- `/signup`
- `/watch-demo`
- `/schedule-demo`
- `/about`
- `/contact`

Protected:

- `/school-admin`
- `/teacher`
- `/super-admin`
- `/accountant`
- `/librarian`
- `/clerk`

## Deployment

Typical deployment workflow:

1. Push the repository to GitHub
2. Connect the repo to your hosting provider
3. Add frontend environment variables in the hosting dashboard
4. Configure Supabase Edge Function secrets in Supabase
5. Build with:

```bash
npm run build
```

## Notes

- This repository was sanitized for GitHub publishing
- Use `.env.example` as the source of truth for required variables
- Rotate any previously exposed keys before production use
- Experimental or helper code may still exist in folders like `scratch/`

## Related Documents

- `DESCRIPTION.md` for a detailed product description
- `ERP_README.md` for standalone ERP setup notes
- `MOBILE_SETUP.md` for mobile planning and integration notes

## License

Add your preferred license before production use or public distribution.
