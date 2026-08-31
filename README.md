# Ridgeline CRM — B2B Sales Management Portal

A full-stack, enterprise-grade B2B Sales Management platform designed for sales representatives and sales managers. Ridgeline replaces spreadsheet-based tracking with a unified, role-scoped workflow covering lead management, automated conversion, pipeline stage transitions, customer activity timelines, and real-time manager reporting.

---

## 📌 Features

- **Public Marketing Landing Page (`/`)**: High-converting public landing page featuring scroll-linked GSAP motion animations, sticky blur navigation, interactive pipeline trail preview, and responsive design for logged-out visitors.
- **Role-Based Access Control (RBAC)**: Enforces strict scoping between Sales Reps (ownership-bound access) and Sales Managers (team-wide oversight).
- **Lead Lifecycle Management (PRD FR-2.1–2.5)**: Searchable, filterable lead lists, detailed edit views, manager-only lead creation, and status validation (including mandatory min 5-character disqualification reasons).
- **Atomic Lead Conversion Workflow (PRD FR-2.4)**: Single-click lead conversion (`POST /api/v1/leads/:id/convert`) wrapped in an atomic Prisma `$transaction` that creates a Customer profile and opens an Opportunity deal in parallel.
- **Pipeline & Stage Machine (PRD FR-3.1–3.4)**: Strict 6-stage sequential forward pipeline (`New` → `Contacted` → `Qualified` → `Proposal` → `Negotiation` → `Won`), terminal stage locking (`Won`/`Lost`), and mandatory lost reason enforcement for deals marked `Lost`.
- **Customer CRM & Activity Timelines (PRD FR-4.1–5.3)**: Complete customer profiles, single-primary-contact invariant enforcement, and a reverse-chronological timeline of logged calls, meetings, and notes.
- **Manager Performance Dashboard (PRD FR-6.1–6.4)**: Aggregate sales metrics (open pipeline value, monthly win rates, follow-ups due) and per-rep performance breakdowns mathematically verified against top-level totals.
- **Team Management (PRD FR-7.1)**: Manager-only user activation/deactivation toggles (`PATCH /api/v1/users/:id`).

---

## 🛠️ Technology Stack

### Backend
- **Core**: Node.js, Express.js (v4), TypeScript
- **Database & ORM**: PostgreSQL / SQLite, Prisma ORM (v5)
- **Validation**: Zod (schema-driven validation at HTTP boundary)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing, custom RBAC middleware
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Modern Vanilla CSS Design System (CSS variables, HSL color tokens, dark mode dashboard, glassmorphism)
- **Animation Dependency Exception**:
  - `gsap` (+ `gsap/ScrollTrigger`): Added as an explicit, justified exception to Section 1.9 of the Implementation Plan. It powers scroll-linked motion on the public Ridgeline landing page (`/`) — including sticky blur navigation, scroll-reveal cards, dashboard scale-in, and the signature pinned 6-stage pipeline trail. `gsap` is isolated exclusively to the public landing page route and cleaned up via `gsap.context()` on component unmount.

---

## 🗄️ Database Architecture & Diagrams

The system architecture and database ER diagrams are checked in directly to the repository:
- Documentation file: [`ARCHITECTURE_AND_ER_DIAGRAMS.md`](./ARCHITECTURE_AND_ER_DIAGRAMS.md)

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="file:./dev.db"   # Or postgresql://user:password@localhost:5432/ridgeline_crm
JWT_SECRET="super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
NODE_ENV="development"
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 2. Backend Setup & Database Seeding
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Push database schema (SQLite / PostgreSQL)
npx prisma db push

# Seed initial users, leads, opportunities, and activities
npm run seed

# Start development backend server (port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```

Visit `http://localhost:5173/` in your browser. Logged-out visitors see the Ridgeline public marketing landing page. Click **Log in** to access the CRM portal.

---

## 🔑 Sample Credentials (Seeded Test Users)

All seeded test accounts share password: `password123`

| User Name | Role | Email Address | Access Scope |
|---|---|---|---|
| Alice Manager | Sales Manager | `manager_1@acme.test` | Team-wide oversight, manager dashboard, user status management |
| Bob Rep | Sales Rep | `rep_1@acme.test` | Rep 1 owned leads, opportunities, and customers |
| Charlie Rep | Sales Rep | `rep_2@acme.test` | Rep 2 owned leads, opportunities, and customers |
| Diana Rep | Sales Rep | `rep_3@acme.test` | Rep 3 owned leads, opportunities, and customers |
| Evan Rep (Inactive) | Sales Rep | `rep_4@acme.test` | Deactivated test account (login rejected with `ACCOUNT_INACTIVE`) |

---

## 🧪 Running Integration Tests & Code Quality Audits

### 1. Backend Test Suite
```bash
cd backend
npm test
```
*Executes all 6 integration test suites (40 test cases) covering Auth, Leads, Conversion, Opportunities, Customers, and Dashboard.*

### 2. Frontend Code Quality Audit (ESLint + TypeScript Typecheck)
```bash
cd frontend
npm run lint
npx tsc --noEmit
```

---

## 📌 Known Limitations

1. **User Self-Registration**: No public `POST /auth/register` endpoint is exposed. In alignment with PRD Section 3 (Non-Goals), user accounts are pre-seeded or provisioned by system administrators. User activation status is managed by managers via `PATCH /api/v1/users/:id`.
2. **Single Currency**: All deal values and metrics assume USD (`$`). Multi-currency support is omitted for POC simplicity.
3. **No File Attachments**: Customer activities and lead records support rich text notes but do not accept binary file attachments or documents.

---

## 🔮 Future Improvements

1. **Email Notifications**: Webhook integration for sending automated email follow-up reminders.
2. **CSV Data Export**: One-click CSV exports for pipeline reports and customer interaction history.
3. **Calendar Integration**: Syncing follow-up dates directly with Google Calendar / Outlook APIs.
