# System Architecture & Database ER Diagrams

This document contains the official **System Architecture Diagram** and **Entity-Relationship (ER) Diagram** for the CRM Sales Management Portal, reflecting the exact as-built implementation.

---

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Frontend["Frontend Layer (React 18 + TypeScript + Vite)"]
        UI["React SPA Components / Router"]
        AuthContext["Auth Context (JWT State & LocalStorage)"]
        ApiClient["Typed API Client (Fetch Adapter)"]
        UI --> AuthContext
        UI --> ApiClient
    end

    subgraph API["Backend API Layer (Express.js + TypeScript)"]
        AuthMw["Authentication & RBAC Middleware"]
        Router["Express Routers (/api/v1/*)"]
        ZodVal["Zod Validation Layer"]
        Controllers["Controllers (HTTP Adapters)"]
        Services["Service Layer (Business Logic & Transactions)"]
        
        Router --> AuthMw
        AuthMw --> ZodVal
        ZodVal --> Controllers
        Controllers --> Services
    end

    subgraph Data["Data Persistence Layer"]
        Prisma["Prisma ORM (Client v5)"]
        DB[(PostgreSQL / SQLite Database)]
        
        Services --> Prisma
        Prisma --> DB
    end

    ApiClient -->|HTTP REST + Bearer JWT| Router
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ leads : "owns"
    users ||--o{ opportunities : "manages"
    users ||--o{ activities : "logs"

    leads ||--o| customers : "converts into"

    customers ||--o{ contact_persons : "has"
    customers ||--o{ opportunities : "originates"
    customers ||--o{ activities : "records"

    opportunities ||--o{ activities : "associates"

    users {
        int id PK
        string name
        string email UK
        string password_hash
        enum role "rep | manager"
        boolean is_active
        datetime created_at
    }

    leads {
        int id PK
        string company_name
        string contact_name
        string contact_email
        string contact_phone
        enum source "Website | Referral | Cold Call | Trade Show | Other"
        enum status "New | Contacted | Qualified | Converted | Disqualified"
        string disqualify_reason
        int owner_id FK
        datetime created_at
        datetime updated_at
    }

    customers {
        int id PK
        string company_name
        string industry
        string billing_address
        int converted_from_lead_id FK,UK
        datetime created_at
    }

    contact_persons {
        int id PK
        int customer_id FK
        string name
        string title
        string email
        string phone
        boolean is_primary
    }

    opportunities {
        int id PK
        int customer_id FK
        int owner_id FK
        enum stage "New | Contacted | Qualified | Proposal | Negotiation | Won | Lost"
        float deal_value
        datetime expected_close_date
        string lost_reason
        datetime created_at
        datetime updated_at
    }

    activities {
        int id PK
        int customer_id FK
        int opportunity_id FK
        int owner_id FK
        enum type "call | meeting | note"
        string notes
        datetime next_follow_up_date
        datetime created_at
    }
```

---

## 3. Architecture & Schema Verification Highlights

1. **RBAC & Scoping Security**:
   - `users.role` (`rep` | `manager`) strictly controls API access.
   - Reps can only query/edit leads and opportunities where `owner_id = user.id`.
   - Managers have team-wide read/write and account status management (`users.is_active`).

2. **Lead-to-Opportunity Transaction**:
   - Lead conversion (`POST /leads/:id/convert`) operates inside a single atomic Prisma transaction (`prisma.$transaction`).
   - Ensures `Customer` creation, `Opportunity` initialization, and `Lead` status updates to `Converted` succeed or roll back together atomically.

3. **Single Primary Contact Invariant**:
   - `contact_persons.is_primary` ensures that setting a contact to primary automatically resets `is_primary = false` for all other contacts under the same `customer_id`.
