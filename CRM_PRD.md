# Product Requirements Document
## CRM / Sales Management Portal — MVP

**Companion document:** `CRM_POC_Design_Document.docx` is the source of truth for architecture, database schema, API contracts, and the pipeline state machine. This PRD is the source of truth for **product behavior, UX rules, and acceptance criteria**. Where the two overlap, this document defines *what the user should experience*; the POC doc defines *how it's built*.

**How to use this doc (note for the coding agent):** Implement strictly in priority order (P0 → P1 → P2). Do not add fields, screens, or behaviors not listed here or in the POC doc. Where a decision isn't specified, prefer the simplest option consistent with Section 11 (Assumptions) rather than asking — this is a solo project with no stakeholder to interrupt.

---

## 1. Problem Statement

A B2B sales team currently tracks leads and deals through spreadsheets and email. Leads go stale with no visible owner or next action, management has no real-time view of pipeline health, and there's no single record of a customer's interaction history after a deal closes. The MVP replaces this with a single system of record for the lead-to-customer lifecycle.

## 2. Goals

1. A Sales Rep can go from "lead assigned to me" to "deal marked Won," with every step captured in the system — zero steps happen outside the app.
2. A Manager can answer "how healthy is my pipeline right now" from one screen, with no manual counting.
3. No sales rep can view or modify another rep's leads, opportunities, or activity history, enforced at the API layer.
4. Every write action (create lead, convert, change stage, log activity) succeeds or fails with a clear, specific message — no silent failures, no generic "something went wrong."

## 3. Non-Goals

- **Email/calendar integration** — out of scope. A "log activity" form is the substitute for real email sending. *(Too much external-service complexity for the MVP window.)*
- **Multi-tenant / multi-company support** — out of scope. One company, one shared pool of reps and managers. *(Adds an entire authorization dimension not needed to prove the core workflow.)*
- **Lead scoring, AI suggestions, duplicate detection** — out of scope. *(Analytical/ML feature, not core CRUD+workflow value.)*
- **Notifications (email/push/in-app toasts for follow-ups due)** — out of scope for v1; follow-ups due appear only as a dashboard count and a filtered list. *(Requires a delivery mechanism disproportionate to the MVP.)*
- **Password reset / forgot-password flow** — out of scope. Seeded users only; a Manager can deactivate/reactivate accounts but not reset passwords via email. *(No email service in scope.)*

## 4. Personas

| Persona | Description | Primary goal in the app |
|---|---|---|
| **Sales Representative** | Owns a set of leads and opportunities. Works the pipeline day to day. | Know exactly what to do next: which leads to contact, which follow-ups are due, which deals to push forward. |
| **Sales Manager (Admin)** | Oversees the whole team. Assigns leads, monitors pipeline health. | See team-wide health at a glance and rebalance work across reps. |

There is no "Customer" end-user in the MVP — customers are records managed by internal staff, not external logins.

## 5. Information Architecture / Screen List

| # | Screen | Access | Purpose |
|---|---|---|---|
| 1 | Login | Public | Email + password auth |
| 2 | Dashboard (Home) | Rep, Manager | Role-scoped summary metrics + follow-ups due today |
| 3 | Leads List | Rep, Manager | Filterable/searchable table of leads |
| 4 | Lead Detail / Edit | Rep (own), Manager (any) | View + edit a single lead; "Convert" action |
| 5 | New Lead | Manager only | Create a lead and assign an owner |
| 6 | Pipeline (Opportunities) | Rep, Manager | List or board of opportunities grouped/filterable by stage |
| 7 | Opportunity Detail | Rep (own), Manager (any) | Deal info, stage-transition control, linked customer |
| 8 | Customer Detail | Rep (own), Manager (any) | Company profile, contacts, full activity timeline, "Log Activity" action |
| 9 | Team (User list) | Manager only | List reps, used for lead-assignment dropdowns; activate/deactivate |

No separate "Settings" screen is required for the MVP.

## 6. Functional Requirements

Each requirement includes a priority (P0 = must-have for MVP to be considered done; P1 = build if time remains; P2 = documented, not built) and acceptance criteria in Given/When/Then form.

### 6.1 Authentication — P0

**FR-1.1** Users log in with email + password.
- Given a registered, active user enters correct credentials, When they submit the login form, Then they are redirected to the Dashboard and a token is stored for subsequent requests.
- Given a user enters an incorrect password or unknown email, When they submit, Then they see a single generic message: "Invalid email or password" (never reveal which field was wrong).
- Given a deactivated user enters correct credentials, When they submit, Then login is rejected with "This account is inactive. Contact your administrator."

**FR-1.2** Session expiry.
- Given a user's token has expired, When they perform any action requiring auth, Then they are redirected to Login with the message "Your session expired — please log in again," and are returned to their previous page after re-authenticating.

**FR-1.3** Logout.
- Given a logged-in user clicks Logout, When the action completes, Then their token is cleared client-side and they land on the Login screen.

### 6.2 Lead Management — P0

**FR-2.1** Create a lead (Manager only).
- Fields: Company Name (required), Contact Name (required), Contact Email (required, valid email format), Contact Phone (optional), Source (required, one of: Website, Referral, Cold Call, Trade Show, Other), Assigned Rep (required, dropdown of active reps).
- Given all required fields are valid, When the Manager submits, Then a lead is created with status `New` and appears immediately in that rep's lead list.
- Given the email field is not a valid email format, When the Manager submits, Then the form blocks submission and shows "Enter a valid email address" under that field, without clearing other fields.

**FR-2.2** Lead statuses: `New`, `Contacted`, `Qualified`, `Converted`, `Disqualified`. Status is set by the owning rep (or Manager) directly, except `Converted`, which is only set by the Convert action (FR-2.4) — never manually.

**FR-2.3** List, filter, search.
- Given a Rep opens Leads List, When the page loads, Then only leads where they are the assigned owner are shown.
- Given a Manager opens Leads List, When the page loads, Then all leads are shown.
- The list supports filtering by Status and Source, and free-text search across Company Name and Contact Name.
- Given a filter/search returns zero results, When applied, Then the list shows an explicit empty state: "No leads match these filters" with a "Clear filters" action — never a blank table.

**FR-2.4** Convert a lead to a Customer + Opportunity.
- Only available from Lead Detail, and only when status is `Contacted` or `Qualified` (not `New`, not already `Converted`/`Disqualified`).
- Given a Rep or Manager clicks "Convert" on an eligible lead, When they confirm the action (with a confirmation dialog stating this cannot be undone), Then: a Customer record is created from the lead's company info, a Contact Person is created from the lead's contact info (marked primary), a new Opportunity is created in stage `New` owned by the same rep, the Lead's status flips to `Converted`, and the user is redirected to the new Opportunity Detail screen.
- Given the Convert action is attempted on an ineligible lead (e.g., status `New`), When triggered via a direct API call bypassing the UI, Then the API returns 409 with `{"error": "INVALID_STATE", "message": "Lead must be Contacted or Qualified before conversion."}`

**FR-2.5** Edit / Disqualify a lead.
- A Rep can edit any field on their own lead and set status to `Disqualified` (with a required "reason" text field, min 5 characters) at any point before conversion.
- Given a Rep attempts to edit or disqualify a lead they do not own, When they submit (via UI or direct API call), Then the request is rejected with 403 and the UI shows "You don't have access to this lead."

### 6.3 Opportunity / Pipeline Management — P0

**FR-3.1** Pipeline stages, in order: `New → Contacted → Qualified → Proposal → Negotiation → Won`, with `Lost` reachable from any stage before `Won`. (Note: opportunity stage names re-use lead-stage vocabulary but are a fully separate field on a separate entity — see POC doc §8.2.)

**FR-3.2** View pipeline.
- Default view is a list grouped by stage with a count and total deal value per stage group.
- Supports filtering to a single stage and to "my opportunities" (default for Reps) vs. "all" (Manager only, toggle available).

**FR-3.3** Advance / regress / close a deal.
- Given an opportunity is in any non-terminal stage, When its owner (or a Manager) selects the next sequential stage, Then the stage updates and `updatedAt` refreshes.
- Given an opportunity is in any non-terminal stage, When its owner selects "Mark Lost," Then a required "Lost reason" free-text field must be filled before the stage updates to `Lost`.
- Given a user attempts to skip a stage (e.g., `New` directly to `Proposal`) or move backward, When submitted via the UI, Then the UI disables those options in the stage-selector entirely (they should not even be selectable) — the API-level 409 rejection (POC doc §10) is the defense-in-depth backstop for direct API calls.
- Given an opportunity is already `Won` or `Lost`, When any user views its detail page, Then the stage-transition control is not shown at all; the stage is displayed as a read-only badge.

**FR-3.4** Deal fields: Deal Value (required, numeric, ≥ 0), Expected Close Date (required, must be today or a future date at creation time — no validation re-check after creation, since deals can run past their original estimate).

### 6.4 Customer & Contact Management — P0

**FR-4.1** Customer Detail shows: company info, all Contact Persons (with the primary one visually distinguished), all linked Opportunities (past and present, with stage), and a reverse-chronological Activity timeline.

**FR-4.2** Add an additional Contact Person.
- Fields: Name (required), Title (optional), Email (required, valid format), Phone (optional), "Set as primary" checkbox.
- Given "Set as primary" is checked, When saved, Then any previously-primary contact for that customer is automatically un-marked (exactly one primary contact per customer at all times).

### 6.5 Activity Logging & Follow-ups — P0

**FR-5.1** Log an activity from Customer Detail (optionally linked to a specific Opportunity).
- Fields: Type (Call / Meeting / Note — required), Notes (required, min 3 characters), Next Follow-up Date (optional).
- Given an activity is saved, When the page refreshes, Then it appears at the top of that customer's activity timeline immediately (no manual refresh needed).

**FR-5.2** Follow-ups due.
- "Follow-ups due today" on the Dashboard counts activities where `next_follow_up_date <= today` and no later activity has superseded it — for MVP simplicity, an activity is considered "resolved" once a newer activity is logged against the same customer with a later or empty follow-up date. (See Assumption A-3.)

### 6.6 Dashboard — P0

**FR-6.1** Rep view shows, scoped to their own records only: total open leads, leads by status (small breakdown), open opportunities count + total value, follow-ups due today (with a link straight to the filtered list), and Won vs. Lost count for the current calendar month.

**FR-6.2** Manager view shows the same metric set, unscoped (whole team), plus: a per-rep breakdown table (rep name, open leads, open pipeline value, deals won this month) and overall conversion rate (Won ÷ (Won + Lost), current calendar month).

**FR-6.3** Empty/loading states.
- Given the dashboard is fetching data, When the screen first renders, Then skeleton placeholders are shown for each metric card — never a blank screen or a layout shift once data arrives.
- Given a Rep has zero leads/opportunities (new account), When they view the dashboard, Then every metric shows "0" with a friendly empty message, not an error.

### 6.7 Global UI Requirements — P0

- **Navigation:** persistent top or side nav with Dashboard, Leads, Pipeline, Team (Manager only), and a visible current-user name + Logout. Active section is visually indicated.
- **Loading states:** every data-fetching view shows a loading indicator; no view may render with stale data while a refetch is in flight without indicating it.
- **Error states:** any failed API call surfaces a specific, human-readable message from the API's `message` field — never a raw error object or console-only failure. A retry action is provided for failed GET requests.
- **Form validation:** all required-field and format errors are shown inline, next to the field, on blur or submit — not only in a toast/banner.
- **Responsiveness:** all screens must be usable (not necessarily pixel-perfect) at both a 1280px+ laptop width and a ~390px mobile width. Tables should scroll horizontally or collapse to cards on mobile rather than overflow the viewport.

## 7. Consolidated Validation & Business-Rule Reference

| Field / Action | Rule |
|---|---|
| Any email field | Must match standard email format |
| Lead.status → `Converted` | Only settable via the Convert action, never a direct status edit |
| Lead.status → `Disqualified` | Requires a reason (≥ 5 chars) |
| Opportunity.stage | Forward-sequential only, or jump to `Lost` from any non-terminal stage; `Won` only from `Negotiation`; both terminal |
| Opportunity.dealValue | Numeric, ≥ 0 |
| Opportunity.expectedCloseDate | ≥ today, checked at creation only |
| Customer contact persons | Exactly one `is_primary = true` per customer at all times |
| Activity.notes | ≥ 3 characters |
| Ownership (Lead/Opportunity/Activity) | A Rep may only read/write records where they are the owner; a Manager may read/write all. Enforced server-side on every request, independent of what the UI shows. |
| Deactivated user | Cannot log in; their existing owned records remain visible to Managers and are reassignable |

## 8. Data & API Reference

Full schema, entity relationships, and endpoint list are defined in `CRM_POC_Design_Document.docx`, Sections 8–10. This PRD does not redefine them — implement exactly as specified there. The only additions this PRD makes beyond that doc are the field-level validation rules in Section 7 above and the UI-level stage-selector restriction in FR-3.3 (a product/UX decision, not a data-layer one).

## 9. Non-Functional Requirements

Inherit all items from the POC doc, Section 12 (security, validation, data exposure, error handling, performance, config). Additionally for product behavior:
- No destructive action (Convert, Disqualify, Mark Lost) executes without an explicit confirmation step.
- No screen should require more than 2 clicks from the Dashboard to reach any other screen.

## 10. Out of Scope for MVP (Explicit)

Everything listed in Section 3 (Non-Goals), plus: bulk actions (bulk-assign, bulk-delete), CSV import/export, saved/custom filters, dark mode, in-app search across all entities (search is scoped per-list only).

## 11. Assumptions Made (no stakeholder available — do not stall on these)

- **A-1:** Lead sources are a fixed enum (Website, Referral, Cold Call, Trade Show, Other), not user-configurable.
- **A-2:** There is no limit on how many opportunities a single Customer can have; each conversion always creates exactly one new Opportunity (re-converting the same customer isn't possible since Leads convert once).
- **A-3:** "Follow-up resolved" logic (FR-5.2) is intentionally simple for MVP; a dedicated `is_resolved` flag on Activity is a good P1 upgrade if time allows, but is not required.
- **A-4:** Currency is unspecified/implicit (a single, unlabeled numeric value) — no currency symbol or multi-currency logic is in scope.
- **A-5:** "Today" for date comparisons uses server time; no timezone-per-user handling is in scope.

## 12. Definition of Done for MVP

- [ ] All P0 requirements in Section 6 are implemented and manually verified against their acceptance criteria.
- [ ] A Rep cannot access another rep's data through any screen or direct API call (tested, not just assumed).
- [ ] Dashboard numbers are internally consistent (Manager totals = sum of all reps' scoped totals).
- [ ] Every form in Section 6 shows inline validation errors matching Section 7's rules.
- [ ] Every list/detail screen has a working loading state, empty state, and error state.
- [ ] The 7 automated tests specified in the POC doc (§14) pass.

## 13. Recommended Build Order (maps to POC doc §15 hour plan)

1. Auth (FR-1.x) → 2. Leads CRUD + list/filter (FR-2.1–2.3, 2.5) → 3. Conversion (FR-2.4) → 4. Opportunities + stage transitions (FR-3.x) → 5. Customer detail + contacts (FR-4.x) → 6. Activity logging (FR-5.x) → 7. Dashboard (FR-6.x) → 8. Global UI polish pass (FR-6.7) → 9. Tests.

Build in this order even if working feature-by-feature end-to-end (backend+frontend together per numbered item) rather than all-backend-then-all-frontend — this keeps each merged increment demoable.
