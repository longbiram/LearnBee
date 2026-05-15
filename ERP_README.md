# LearnBee ERP (Standalone Project Guide)

## Overview
This document serves as the comprehensive bootstrap guide for creating a new standalone **LearnBee ERP** project. This version extracts the ERP system from the main educational platform, pairing it solely with a public-facing Landing Page while connecting to the *same existing Supabase database*.

---

## 1. Tech Stack & Dependencies

The project uses a modern React ecosystem optimized for speed and visual fidelity. Ensure your new project is initialized with Vite (`npm create vite@latest my-erp-app -- --template react`).

### Core Dependencies
Run the following to install the exact required frontend dependencies:
```bash
npm install react@^19.2.0 react-dom@^19.2.0
npm install react-router-dom@^7.13.0
npm install @supabase/supabase-js@^2.93.3
npm install @tanstack/react-query@^5.90.20
```

### UI & Aesthetics
```bash
npm install tailwindcss@^4.1.18 @tailwindcss/vite@^4.1.18
npm install framer-motion@^12.29.2
npm install lucide-react@^0.563.0
npm install react-hot-toast@^2.6.0
```

### Reporting & Utilities
```bash
npm install html2canvas@^1.4.1 jspdf@^4.0.0
npm install react-qr-code@^2.0.18 react-barcode@^1.6.1
```

---

## 2. Environment Variables & Credentials

Create a `.env` file in the root of your new project and populate it. **These are required for database access, authentication, and edge functions.**

```env
# Supabase Client Configuration (Frontend Auth & Edge Function Caller)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Backend/Admin Access (For Edge Functions/CLI Usage - DO NOT expose in frontend)
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
SUPABASE_DB_URL=your-supabase-database-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Upstash Redis Configuration (Rate Limiting & Caching via Edge Functions)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# AI Services (If needed for generative reports/chat)
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key
VITE_GOOGLE_TTS_API_KEY=your-google-tts-api-key

# RevenueCat Integration (Payments)
VITE_REVENUECAT_PUBLIC_KEY=your-revenuecat-public-key
```

---

## 3. Design Style & Theme

The ERP system inherits the platform's core **"Dark Premium SaaS"** aesthetic.
Modify your `index.css` to include the following core variables:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

:root {
  font-family: 'Outfit', system-ui, sans-serif;
  color-scheme: dark;
  color: rgba(255, 255, 255, 0.9);
  background-color: #050505;
}
```

### Visual Identity
- **Backgrounds**: `#0A0A0A` (Primary Background) and `#111111` / `#121212` (Surface/Card Backgrounds).
- **Accents**: `#00FF88` (Neon Green) for primary actions, active states, and focus glows.
- **Glassmorphism**: Use `backdrop-blur`, `bg-white/5`, and subtle transparent borders (`border-white/10`).
- **Depth & Elevation**: Use heavy but soft drop shadows (`shadow-2xl`, `shadow-black/50`) instead of flat borders.
- **Micro-interactions**: Hover effects (`scale-105`), opacity changes, and border glows on focus.

---

## 4. Application Architecture

To ensure high performance and scalability up to thousands of concurrent users, the architecture enforces a strict decoupling of the UI from direct database queries.

1. **Authentication**: Supabase Auth (used exclusively for JWT issuance, login, and logout).
2. **API Layer**: **Supabase Edge Functions**. The frontend uses `supabase.functions.invoke()` for **all** data retrieval and mutations.
3. **Caching**: Upstash Redis (acts as the primary HOT path for cached reads, executed within the Edge Functions).
4. **Database**: Supabase Postgres (COLD source of truth).

### Required Edge Functions
Ensure the following edge functions are deployed to your Supabase instance:
- `erp-academics`: Session management, subjects, assignments.
- `erp-students`: Admissions, directory, promotions, repeaters, transfers.
- `erp-exams`: Exam creation, scheduling, and marks entry.
- `erp-reports`: Academic analytics and report card generation.

---

## 5. Directory Structure & Routing

Your new `src/` folder should be mapped out as follows:

```text
src/
├── components/
│   ├── Landing/           # Public landing page sections (Hero, Features, Pricing)
│   ├── ERP/               # Shared ERP UI components (Sidebar, Topbar, Modals)
│   └── ui/                # Reusable atoms (Buttons, Inputs, Cards)
├── pages/
│   ├── LandingPage.jsx    # The public-facing entry route ('/')
│   ├── Login.jsx          # Auth entry ('/login')
│   └── ERP/               # Protected ERP Routes ('/dashboard/erp/*')
│       ├── ERPDashboard.jsx
│       ├── ERPSettings.jsx
│       ├── StudentAdmission.jsx
│       ├── StudentDirectory.jsx
│       ├── StudentPromote.jsx
│       ├── StudentRepeater.jsx
│       ├── StudentTransfer.jsx
│       ├── ClassSessionManagement.jsx
│       ├── SubjectManagement.jsx
│       ├── SubjectAssignments.jsx
│       ├── StaffManagement.jsx
│       ├── ExamManagement.jsx
│       ├── TeacherMarksEntry.jsx
│       └── ReportEngine.jsx
├── layouts/
│   └── ERPLayout.jsx      # Wraps ERP pages in Sidebar/Header
├── routes/
│   └── index.jsx          # React Router configuration
├── App.jsx
└── main.jsx
```

### Setup Steps
1. Create the Vite project and install dependencies.
2. Initialize Tailwind CSS (`@tailwindcss/vite` plugin configuration inside `vite.config.js`).
3. Set up React Router in `App.jsx` with a Public Route (`<LandingPage />`) and Protected Routes (`<ERPLayout />`).
4. Copy over the `.env` attributes shown above.
5. Migrate the `src/pages/ERP` directory and the `src/layouts/DashboardLayout.jsx` from the old repo into the new app.
6. Verify auth flow via Supabase Login, triggering a redirect to `/dashboard/erp`.
