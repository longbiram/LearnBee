# LearnBee ERP - Project Overview

LearnBee ERP is a comprehensive, cloud-first School Enterprise Resource Planning (ERP) and SaaS platform designed to digitize, automate, and streamline all administrative, financial, academic, and operational workflows of educational institutions. 

Built with a highly secure, role-based access control (RBAC) system, the platform provides tailored dashboards and functional interfaces for **Super Admins**, **School Admins**, **Teachers**, **Accountants**, **Librarians**, **Clerks**, and **Students**.

---

## 🚀 Architecture & Tech Stack

LearnBee ERP enforces a strictly decoupled, highly secure architectural pattern:
```
Client (React) ──[ JWT Authorization ]──> Supabase Edge Functions (Deno) ──> Supabase Postgres
                                                        │
                                                        └──> [ Caching Layer ] ──> Upstash Redis
```

*   **Frontend**: React 19 + Vite 8, TypeScript, TailwindCSS v4 (via Vite plugin), Framer Motion v12 (for fluid page transitions and micro-animations), Lucide React (for iconography), and `@studio-freight/lenis` (for smooth scrolling).
*   **Security & Decoupled APIs**: Direct database calls from the client are prohibited. All read and write operations are routed through secure **Supabase Edge Functions** (written in TypeScript on the Deno runtime). Every API call carries the user's JWT access token for role and school-level authorization validation.
*   **Caching & Optimization**: **Upstash Redis** is integrated directly within Edge Functions as a fast-read caching layer for active school configurations, academic sessions, staff records, and subject lists.
*   **Document Generation**: Client-side high-quality PDF/A4 printing engine leveraging `html2canvas` and `jspdf` for generating printable receipts, Transfer Certificates (with custom QR/Barcodes), and Report Cards.

---

## 👥 Role-Based Dashboards & Workspaces

LearnBee ERP implements secure routing (`ProtectedRoute`) to isolate workspaces based on user roles:

### 1. ⚡ Super Admin Dashboard (`/super-admin`)
Used by SaaS platform owners to manage schools, monitor system-wide metrics, and control the App Marketplace.
*   **Schools Directory (`/super-admin/schools`)**: View all registered schools, subscription health, active modules, and onboard new institutions.
*   **Onboarding Wizard (`/super-admin/schools/add`)**: Form-based provisioning of school databases, admin accounts, and settings.
*   **Subscription Management (`/super-admin/subscriptions`)**: Track billing plans, trial periods, revenues, and transaction histories.
*   **Marketplace Manager (`/super-admin/marketplace`)**: Publish modules, roll out functional application updates, and set pricing models.

### 2. 🏛️ School Admin Dashboard (`/school-admin`)
The control center for individual schools to manage profiles, classes, staff, fees, settings, and installed applications.
*   **Live Analytics**: Real-time widgets tracking total students, staff attendance, fees collected today, active classes, and notification logs.
*   **App Store (`/school-admin/apps`)**: Dynamic interface to browse, purchase, install, activate, or deactivate marketplace modules.

### 3. 👩‍🏫 Teacher Dashboard (`/teacher`)
A customized environment tailored for classroom and student performance management.
*   **Home & Schedules**: Quick links to daily class routines, notices, and assigned subjects.
*   **Attendance Marker (`/teacher/attendance`)**: Mark student presence, late logs, or half-days.
*   **Marks Entry (`/teacher/results`)**: Direct entry of academic assessments and student exam remarks.
*   **Self-Service Check-In**: Geofenced daily check-in and checkout tracking.

### 4. 💰 Accountant Dashboard (`/accountant`)
A dedicated finance workspace optimized for high-volume fee transaction processing, invoice generation, receipts, and school payroll workflows.

### 5. 📚 Librarian Dashboard (`/librarian`)
A specialized library cataloging and tracking interface for stock registry, books reservation, issuance logs, return flows, and overdue fine calculations.

### 6. 📝 Clerk Dashboard (`/clerk`)
An operational workstation tailored for daily entry workflows: student registrations, document verification, printing ID cards, and issuing certificates.

---

## 📦 Core Functional Modules

### 1. Student Administration
*   **Comprehensive Admission Form**: Multi-step student profile creation containing personal data, parent/guardian info, transport preferences, hostel details, and documents uploads.
*   **Unified Directory (`/school-admin/students`)**: High-performance, filterable datatable supporting search, class/section filters, status filters, and detailed drawer-based profile views.
*   **Promotion Manager (`/school-admin/students/promote`)**: End-of-session promotion wizard enabling bulk class upgrades with repeaters handling.
*   **Transfer Certificate (TC) Engine (`/school-admin/students/transfer`)**: Form-guided creation and storage of official school-leaving certificates. Generates high-fidelity printable A4 documents containing embedded **QR Codes** and **Barcodes** for third-party authenticity verification.
*   **ID Card Generator (`/school-admin/students/id-cards`)**: Automated generation of student ID cards using customizable styling templates.

### 2. Staff, Teacher & HR Management
*   **Staff Registry (`/school-admin/staffs`)**: Track profiles, designations, personal details, and employment statuses for non-teaching personnel.
*   **Teacher Registry (`/school-admin/teachers`)**: Manage qualifications, departments, teaching experiences, and contact details.
*   **Dynamic Classroom Mapping**: Assign one-to-many configurations of class-subject-teacher mappings via active settings.
*   **Payroll Processing (`/school-admin/payroll`)**: Calculate base salaries, allowances, deductions, taxes, and generate employee payslips.
*   **Staff Attendance Tracking (`/school-admin/teacher-attendance`)**: Admin dashboard tracking monthly teacher check-in and checkout times with Fallback present formatting and CSV/PDF export.

### 3. Finance & Fees Management
*   **School Fees Module (`/school-admin/fees/school`)**: Structure, assign, and track session-wise tuition and institutional fees. Collect installments and view historical ledgers.
*   **Hostel Fees Module (`/school-admin/fees/hostel`)**: Assign rooms, calculate boarding charges, track mess fees, and collect payments.
*   **Transport Fees Module (`/school-admin/fees/transport`)**: Route-based transport subscription pricing, stop mapping, and transport collections.
*   **Printable Receipts**: Live template engine that produces detailed, print-ready, double-receipt formats on-demand for ledger records.

### 4. Academics, Exams & Operational Tools
*   **Daily Attendance Marker**: Digital register to mark daily student statuses (`present`, `absent`, `leave`, `half_day`) with historical analytics.
*   **Class Timetable/Routine Builder (`/school-admin/routine`)**: Dynamic weekly timetable grid editor to map hours, subjects, and teachers to classes without overlaps.
*   **Notice Board (`/school-admin/notice`)**: Create, publish, and target announcements to specific user roles (e.g., all teachers, students only) with start and expiration dates.
*   **Exams & Assessment Registry**: Set up academic sessions, define grading systems, create exams, record student assessment marks, and compile report card templates.

### 5. Inventory & Resources
*   **Asset & Stock Tracker (`/school-admin/inventory`)**: Track stock quantities of school uniforms, text books, stationery, and other materials.
*   **Sales & Invoicing Workflow**: Handle cash counters sales to parents or students, automatically depleting inventory levels and recording sales transactions.

---

## 🗄️ Database Schema & Entities

LearnBee ERP runs on a secure PostgreSQL relational database, governed by strict RLS (Row Level Security) and structured as follows:

### 🏛️ Institution & Profile Base
*   **`schools`**: Core school table containing name, branding assets, custom domains, geofencing (latitude, longitude, radius for mobile check-in), and subscription levels.
*   **`profiles`**: Tied directly to Supabase `auth.users` via triggers. Stores global user details, profile photos, phone numbers, assigned roles (`super_admin`, `school_admin`, `teacher`, `accountant`, `librarian`, `clerk`, `student`), and platform gamification metrics (XP, streaks).
*   **`staff`**: Holds detailed employment fields, bank details, DOJ, salary bands, and is linked directly to a profile record.
*   **`teachers`**: Extends `staff` for educators, tracking teaching qualification files, specialized subjects, and active designations.

### 🎓 Academic Foundations
*   **`erp_academic_sessions`**: Session registry (e.g. "2024-2025") with date ranges and an active `is_current` boolean flag.
*   **`erp_classes`**: Standard class names and section records (e.g., "Class 10 - A") scoped to a specific school.
*   **`erp_subjects`**: Subject records mapped directly to school classes.
*   **`teacher_subjects`**: Junction table mapping teacher profiles to specific classes and subjects.

### 📊 Records & Transactions
*   **`erp_students`**: Core student registry storing admissions, roll numbers, blood groups, addresses, and family contacts, scoped to active classes and academic sessions.
*   **`erp_attendance`**: Daily records for student attendances storing status and logs.
*   **`erp_fee_collections`**: Fee transaction register capturing payment mode, session details, collections amounts, and timestamps.
*   **`erp_routines`**: JSONB-based weekly routine definitions to guarantee flexibility across complex timetables.
*   **`erp_notices`**: School announcements records containing targeting payloads and expiry settings.
*   **`erp_exams` & `erp_exam_marks`**: Academic assessments, subject marks, max weightages, and compiled student score logs.

---

## 💳 Razorpay Billing & Subscription Engine

LearnBee ERP features an end-to-end monetized subscription engine integrated with the **Razorpay Payment Gateway**, enabling schools to self-onboard and upgrade their SaaS capabilities dynamically.

### 1. Checkout Workflow & Script Injection
*   **Dynamic SDK Loading**: Rather than hardcoding scripts, the school admin's billing view dynamically injects the Razorpay Checkout SDK on demand (`https://checkout.razorpay.com/v1/checkout.js`) for optimized bundle loading.
*   **Payment Customization**: Pre-populates checkout modals with tenant contextual values (e.g., admin's registered name, email, and phone) to streamline the checkout process and enhance user experience.
*   **Seamless Handshake**: Once checkout is approved, the checkout callback initiates a secure backend API handshake to process the upgrade and update structural schemas.

### 2. Secure Processing (Supabase Edge Function)
*   **`saas-platform/subscribe`**: A dedicated API endpoint handles checkout confirmations. Upon invocation, it:
    1. Validates the authorization JWT to identify the corresponding school tenant.
    2. Modifies the `schools` record to transition their plan (e.g., `basic` or `pro`) and set their subscription status to `active`.
    3. Records a complete transaction ledger in the `subscriptions` table.

### 3. Database Schema Modifications
*   **`subscriptions`**: The database schema is augmented to track detailed financial records:
    *   `school_id` (`uuid`): Links the subscription record directly to the affected school.
    *   `amount` (`numeric`): Captures the precise subscription fee paid (e.g., ₹499 for Starter, ₹899 for Pro).
    *   `razorpay_payment_id` (`text`): Stores the unique transaction ID for auditing.
    *   `status` (`text`): Current subscription state (`active`, `expired`, etc.).

### 4. Dashboards & Analytics Integrations
*   **School Settings (`Settings.tsx`)**: Integrates a "Subscription & Billing" workspace where admins can review active plans, renewal timelines, available premium tiers, and full localized transaction histories.
*   **Super Admin Dashboard (`SuperAdminDashboard.tsx`)**: Displays global platform monetization health:
    *   **Monthly Recurring Revenue (MRR)**: Sum of all active subscription amounts processed through Razorpay.
    *   **Active Schools Count**: Real-time counter of active paying institutions.
    *   **Recent Subscription Payments**: Full audited ledger displaying school names, purchased plans, processed amounts, transaction IDs, and exact payment dates.

---

## 🛠️ App Store & Modular Activation Pattern
The application features a modern SaaS monetization model. School administrators can dynamically control the active scope of their platform inside the **App Store (`/school-admin/apps`)**:

1.  **Marketplace Index**: Fetches functional modules currently published by the Super Admin in the `saas-platform/school-apps` Edge Function.
2.  **State Management**:
    *   **Install App**: Triggers creation of the school's workspace modules database registrations.
    *   **Activate / Deactivate**: Toggles the active flag of specific client functional routes and side menus.
    *   **Uninstall**: Safely cleanses associated bindings.

