# LearnBee ERP — Project Description

> **A cloud-first, full-stack School ERP Platform** built for modern educational institutions. LearnBee ERP handles everything from student admissions to fee collection, teacher management, attendance, and official document generation — all behind a role-based authentication system on a premium dark-themed SaaS landing page.

---

## 🎯 Project Purpose

LearnBee ERP is a **School Enterprise Resource Planning (ERP)** web application designed to help school administrators and teachers manage day-to-day operations digitally. It eliminates paper-based workflows by providing real-time, cloud-synced data on students, staff, fees, attendance, timetables, and more.

The platform serves two types of authenticated users:
- **School Admin** — Full control over students, staff, fees, notices, and settings.
- **Teacher** — Access to their dedicated dashboard for class and subject management.

---

## 🧱 Tech Stack

| Layer              | Technology                                         |
|--------------------|----------------------------------------------------|
| **Framework**      | React 19 + TypeScript (Vite 8)                     |
| **Routing**        | React Router DOM v7                                |
| **Styling**        | Vanilla CSS + TailwindCSS v4 (via Vite plugin)     |
| **Animations**     | Framer Motion v12                                  |
| **Icons**          | Lucide React                                       |
| **3D/Canvas**      | React Three Fiber + Drei + Three.js                |
| **Database**       | Supabase PostgreSQL                                |
| **Auth**           | Supabase Auth (JWT-based)                          |
| **API Layer**      | Supabase Edge Functions (Deno runtime)             |
| **Documents**      | react-qr-code + react-barcode (for TC generation) |
| **Scroll UX**      | @studio-freight/lenis (smooth scrolling)           |
| **Font**           | Outfit (Google Fonts)                              |

---

## 🏗️ Architecture

LearnBee ERP follows a **strict decoupled architecture** where the frontend **never accesses the database directly**. All data flows through Supabase Edge Functions acting as a secure API layer.

```
Browser (React) → Supabase Auth (JWT) → Edge Functions → Supabase Postgres
                                      ↘ (optional) Upstash Redis cache
```

### Key Principles
- **No direct DB queries from frontend** — all reads/writes go through Edge Functions
- **JWT-authenticated API calls** — every function invocation carries the user's access token
- **Role-based access** — `ProtectedRoute` component gates pages by user role (`school_admin`, `admin`, `teacher`)
- **Auth-aware routing** — authenticated users are automatically redirected to their role's dashboard

---

## 📁 Project Structure

```
learnbee/
├── src/
│   ├── App.tsx                         # Root router with all route definitions
│   ├── main.tsx                        # React entry + AuthProvider
│   ├── index.css                       # Global CSS, shimmer animations, glass styles
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx             # Auth state, profile fetch, signIn/signOut
│   │
│   ├── lib/
│   │   └── supabase.ts                 # Supabase client initialization
│   │
│   ├── hooks/
│   │   ├── useErpAcademics.ts          # Classes, sessions, staff, subjects, school info
│   │   ├── useErpStudents.ts           # Student data via Edge Functions
│   │   ├── useErpFinance.ts            # Fee data via Edge Functions
│   │   └── useErpClasses.ts           # (Lightweight class utility hook)
│   │
│   ├── components/
│   │   ├── AdminLayout.tsx             # Shared sidebar + topbar layout for all admin pages
│   │   ├── ProtectedRoute.tsx          # Role-gated route wrapper
│   │   ├── PageLayout.tsx              # Generic page wrapper
│   │   ├── Landing/                    # Public landing page sections
│   │   │   ├── Navbar.tsx              # Sticky nav with mobile hamburger menu
│   │   │   ├── HeroSection.tsx         # Animated hero with parallax + particle bg
│   │   │   ├── FeaturesSection.tsx     # 3D tilt feature cards
│   │   │   ├── DashboardPreview.tsx    # Laptop mockup with live-animated dashboard
│   │   │   ├── WhyChooseUs.tsx         # Benefit cards
│   │   │   ├── PricingSection.tsx      # 3-tier pricing cards
│   │   │   ├── CTASection.tsx          # Final call-to-action
│   │   │   ├── Footer.tsx              # Multi-column footer with socials
│   │   │   └── ParticleBackground.tsx  # Canvas particle animation
│   │   └── admin/
│   │       └── fees/                   # Fee receipt modal component
│   │
│   └── pages/
│       ├── LandingPage.tsx             # Public entry route (/)
│       ├── Login.tsx                   # Email/password login
│       ├── Signup.tsx                  # School registration
│       ├── WatchDemo.tsx               # Demo preview page
│       ├── ScheduleDemo.tsx            # Demo booking form
│       ├── SchoolAdminDashboard.tsx    # Main admin dashboard (live stats + overview)
│       ├── TeacherDashboard.tsx        # Teacher-specific dashboard
│       ├── admin/
│       │   ├── students/
│       │   │   ├── AllStudents.tsx     # Student directory with search/filter
│       │   │   ├── AddStudent.tsx      # New student admission form
│       │   │   ├── EditStudent.tsx     # Edit student record
│       │   │   ├── PromoteStudents.tsx # Bulk class promotion tool
│       │   │   ├── TransferTC.tsx      # Transfer Certificate management
│       │   │   └── TCPreviewModal.tsx  # A4 TC document preview + print
│       │   ├── teachers/
│       │   │   ├── AllTeachers.tsx     # Teacher directory
│       │   │   ├── AddTeacher.tsx      # Add teacher + assign classes/subjects
│       │   │   ├── EditTeacher.tsx     # Edit teacher with subject re-assignment
│       │   │   └── ResignedTeachers.tsx # Resigned staff history
│       │   ├── staffs/
│       │   │   ├── AllStaffs.tsx       # Non-teaching staff directory
│       │   │   └── AddStaff.tsx        # Add new staff member
│       │   ├── fees/
│       │   │   ├── SchoolFees.tsx      # Tuition fee collection + receipts
│       │   │   ├── HostelFees.tsx      # Hostel fee management
│       │   │   ├── TransportFees.tsx   # Transport fee management
│       │   │   └── FeeReceiptModal.tsx # Printable fee receipt
│       │   ├── Attendance.tsx          # Attendance marking interface
│       │   ├── Routine.tsx             # Class timetable/routine manager
│       │   ├── Notice.tsx              # School notice board
│       │   └── Settings.tsx            # School settings (profile, classes, sessions, subjects)
│       └── static/                     # Public info pages
│           ├── About.tsx, Blog.tsx, Careers.tsx, Press.tsx
│           ├── Contact.tsx, Documentation.tsx, HelpCenter.tsx
│           ├── Status.tsx, PrivacyPolicy.tsx, Terms.tsx
│           ├── Integrations.tsx, Changelog.tsx
```

---

## ✨ Key Features

### 🏠 Public Landing Page (`/`)
A premium, animated landing page that is **fully responsive** (mobile, tablet, desktop):
- Animated particle background and scroll-parallax hero section
- Floating live stat cards (desktop only) with mouse-tracking parallax
- 3D tilt feature cards (6 features)
- Animated laptop mockup preview of the dashboard
- 3-tier pricing section (Starter / Growth / Enterprise)
- Authentication-aware navbar — shows "Go to Dashboard" for logged-in users
- Mobile hamburger menu with smooth Framer Motion transitions

### 🔐 Authentication & Role-Based Access
- Supabase Auth with email/password login
- `AuthContext` provides: `user`, `session`, `profile`, `schoolId`, `loading`
- User `profile` fetched via `user-profile` Edge Function (no direct DB call)
- `ProtectedRoute` component wraps all admin/teacher pages, checking `role`
- On logout, history is replaced to prevent back-button access
- Role routing: `school_admin` → `/school-admin`, `teacher` → `/teacher`

### 👨‍🎓 Student Management
- **Admit** new students (full profile: personal, academic, contact, emergency info)
- **Directory** with search, class/section filter, status badges
- **Edit** all student fields post-admission
- **Promote** students in bulk at year-end (class upgrade)
- **Transfer Certificate (TC)** — generate and preview a print-ready A4 TC document
  - Double-border design (purple + blue), school logo, QR code, barcode
  - jsPDF / html2canvas for PDF generation

### 👩‍🏫 Teacher Management
- Add teachers with full profile: department, phone, role, status
- Assign **classes + subjects** per teacher (many-to-many via `teacher_subjects`)
- Edit assignments with real-time updates (persisted via Edge Functions)
- View and manage **resigned teachers** separately

### 🏢 Staff Management
- Add and list non-teaching staff (clerks, peons, security, etc.)
- Distinct from teachers in the staff table by `role` field

### 💰 Fees Management
- **School Fees** — collect tuition fees per student per session, generate receipts
- **Hostel Fees** — manage boarding fee payments with room details
- **Transport Fees** — route-based transport fee tracking
- Printable **Fee Receipt Modal** per payment

### 📋 Attendance
- Mark daily attendance for students (Present / Absent / Leave / Half-Day)
- Dashboard shows today's live attendance bars

### 📅 Routine / Timetable
- Weekly timetable builder for class periods

### 📢 Notice Board
- Post and view school notices with date and category

### ⚙️ Settings (Comprehensive)
- School profile (name, logo, address, board affiliation, DISE code)
- **Class management** — add/edit/delete classes and sections
- **Academic sessions** — configure year start/end, mark current session
- **Subject management** — add subjects per class
- **Teacher assignments** — manage teacher-to-subject mappings

### 👨‍🏫 Teacher Dashboard
- Dedicated dashboard for logged-in teachers
- Displays assigned classes and subjects

---

## 🌐 Route Map

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing Page | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/watch-demo` | Demo Video | Public |
| `/schedule-demo` | Book a Demo | Public |
| `/school-admin` | Admin Dashboard | `school_admin` |
| `/school-admin/students` | All Students | `school_admin` |
| `/school-admin/students/add` | Add Student | `school_admin` |
| `/school-admin/students/edit/:id` | Edit Student | `school_admin` |
| `/school-admin/students/promote` | Promote Students | `school_admin` |
| `/school-admin/students/transfer` | Transfer / TC | `school_admin` |
| `/school-admin/teachers` | All Teachers | `school_admin` |
| `/school-admin/teachers/add` | Add Teacher | `school_admin` |
| `/school-admin/teachers/edit/:id` | Edit Teacher | `school_admin` |
| `/school-admin/teachers/resigned` | Resigned Teachers | `school_admin` |
| `/school-admin/staffs` | All Staff | `school_admin` |
| `/school-admin/staffs/add` | Add Staff | `school_admin` |
| `/school-admin/attendance` | Attendance | `school_admin` |
| `/school-admin/fees/school` | School Fees | `school_admin` |
| `/school-admin/fees/hostel` | Hostel Fees | `school_admin` |
| `/school-admin/fees/transport` | Transport Fees | `school_admin` |
| `/school-admin/routine` | Class Routine | `school_admin` |
| `/school-admin/notice` | Notice Board | `school_admin` |
| `/school-admin/settings` | Settings | `school_admin` |
| `/teacher` | Teacher Dashboard | `teacher` |

---

## 🔌 Supabase Edge Functions

All data access is routed through these Edge Functions (Deno runtime):

| Function | Responsibility |
|---|---|
| `user-profile` | Returns the authenticated user's profile + role + school_id |
| `erp-academics` | Classes, academic sessions, staff CRUD, subjects, school info, teacher assignments |
| `erp-students` | Student CRUD, promotion, transfer, TC generation |
| `erp-finance` | Fee collection, hostel/transport fees, receipt generation |

---

## 🎨 Design System

- **Theme**: Dark premium SaaS (landing) + Clean white admin panel
- **Landing background**: `#050508` deep dark with radial glows
- **Admin background**: `#f8fafc` slate surface
- **Primary accent**: `#7c3aed` (Violet-700) — used for active states, buttons, highlights
- **Secondary accent**: `#4F8EF7` (Blue)
- **Font**: `Outfit` (Google Fonts) — clean, geometric, modern
- **Animations**: Framer Motion for page transitions, scroll-triggered reveals, hover tilts
- **Glassmorphism**: `backdrop-filter: blur()` used on landing nav and stat cards

---

## 🔧 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key for Supabase client |
| `VITE_GEMINI_API_KEY` | Google Gemini AI (future AI features) |
| `VITE_ELEVENLABS_API_KEY` | ElevenLabs TTS (future voice features) |
| `VITE_GOOGLE_TTS_API_KEY` | Google TTS (future voice features) |

> **Note**: Service role key, DB URL, and Upstash Redis credentials are used only inside Edge Functions and never exposed to the browser.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build
```

---

## 📦 NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint code quality check |
| `npm run preview` | Preview the production build locally |

---

## 🗓️ Build Status

- ✅ Landing Page (fully responsive, animated)
- ✅ Authentication (login / signup / logout / role-routing)
- ✅ Admin Dashboard (live stats from Edge Functions)
- ✅ Student CRUD (admit, edit, promote, transfer)
- ✅ Transfer Certificate (A4 print-ready with QR + barcode)
- ✅ Teacher CRUD (add, edit, resign, subject assignments)
- ✅ Staff Management
- ✅ Fees (School / Hostel / Transport + Receipts)
- ✅ Attendance tracking
- ✅ School Settings (profile, classes, sessions, subjects)
- ✅ Teacher Dashboard
- 🔄 Notice Board (UI present, backend integration in progress)
- 🔄 Routine/Timetable (UI present, backend integration pending)
