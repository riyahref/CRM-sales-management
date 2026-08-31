# Implementation Plan
## CRM / Sales Management Portal — Build Guide for the Coding Agent

**Companion documents:** `CRM_POC_Design_Document.docx` (architecture/schema/API rationale), `CRM_PRD.md` (product behavior/acceptance criteria), `CRM_API_Spec.yaml` (exact request/response contract). This document governs **how the code gets written** — structure, standards, sequencing, and the quality bar for every commit.

---

## 0. The One-Sentence Brief

> Build this like a senior engineer at a top-tier company would build a small internal tool: **boring, obvious, and correct** — not impressive-looking, not clever, not "framework-of-the-week." A reviewer should be able to open any file and understand it in under 30 seconds without reading anything else.

"FAANG-level" here does **not** mean complex — it means disciplined. The bar is: consistent patterns, no dead code, no premature abstraction, every function does one obvious thing, every name tells the truth, and nothing is in the codebase "just in case." A 150-line CRM MVP built this way is more impressive to a reviewer than a 1500-line one with clever generics and unused flexibility.

---

## 1. Engineering Principles (apply to every file, every commit)

1. **Explicit over clever.** No metaprogramming, no dynamic magic, no "smart" abstractions that save 10 lines today and cost 10 minutes of reading tomorrow. If a junior engineer couldn't read a function top-to-bottom and understand it, rewrite it.
2. **One layer, one responsibility.** Routes parse/respond. Controllers orchestrate. Services hold business logic (the stage-transition table, the conversion transaction). Data access (Prisma) is the only layer that talks to the database. A route handler should never contain a SQL/Prisma call directly, and a service should never touch `req`/`res`.
3. **No premature abstraction.** Don't build a generic `Repository<T>` base class, a plugin system, or a config-driven form engine for a 6-entity MVP. Write the concrete thing. Abstract only after the same pattern appears **three times**, not before.
4. **Small functions, small files.** A function longer than ~30 lines or a file longer than ~200 lines is a signal to split it — usually along the exact responsibility boundaries in Section 3.
5. **Fail loudly in development, safely in production.** Every error either gets handled explicitly (validation, business-rule rejection) or bubbles to one centralized error handler (Section 5.3). Never a silent `catch {}`.
6. **No dead code, ever.** No commented-out blocks, no unused imports/variables, no `// TODO: handle this later` left in the diff. If it's not needed now, don't write it. If it's a genuine known gap, put it in the README's "Known Limitations" section instead of a code comment.
7. **Comments explain *why*, never *what*.** `// reps only see their own leads` is noise (the code already says that). `// scoped by owner_id here, not in the DB query, because...` is a comment worth writing — only when the *reason* isn't obvious from the code itself.
8. **Types are load-bearing, not decorative.** No `any`. Request/response shapes match `CRM_API_Spec.yaml` exactly, ideally generated or hand-mirrored from it — not loosely inferred.
9. **Every dependency must earn its place.** Before adding a package, ask: does the standard library or an already-installed dependency do this well enough? The POC doc's stack (Section 7) is the full dependency list — do not silently add a UI kit, state manager, or utility library beyond it without a one-line justification in the README.

---

## 2. Repository Structure

```
/backend
  /src
    /routes         -- thin Express routers; map HTTP verb+path to a controller fn, nothing else
    /controllers     -- parse req, call one service fn, shape the response; no business logic
    /services        -- business logic: pipeline transition rules, conversion transaction,
                        dashboard aggregation, ownership checks
    /middleware      -- authenticate.ts, requireRole.ts, requireOwnerOrManager.ts, errorHandler.ts
    /validation      -- zod schemas per resource, one file per entity (lead.schema.ts, etc.)
    /prisma
      schema.prisma
      seed.ts
      /migrations
    /lib             -- small, generic helpers only if truly cross-cutting (e.g. jwt.ts, hash.ts)
    app.ts           -- Express app assembly (middleware order, route mounting)
    server.ts        -- process entrypoint (listen, env loading)
  /tests
    /integration     -- Supertest suites, one file per resource, matching Section 14 test cases
  .env.example
  package.json
  tsconfig.json

/frontend
  /src
    /pages           -- one file per screen from PRD §5 (Login, Dashboard, LeadsList, LeadDetail,
                        NewLead, Pipeline, OpportunityDetail, CustomerDetail, Team)
    /components       -- shared, reusable UI only (Table, StageBadge, FormField, EmptyState,
                        ErrorBanner, LoadingSkeleton) — a component used on exactly one page
                        belongs in that page's file, not here
    /api              -- typed fetch client, one function per API-spec endpoint, matching
                        CRM_API_Spec.yaml request/response types exactly
    /types            -- shared TS types mirroring the API spec schemas
    /context          -- AuthContext only (current user + token) — no other global state needed
                        for this MVP; do not add Redux/Zustand/etc.
    App.tsx
    main.tsx
  .env.example
  package.json
  tsconfig.json

README.md
```

**Rule of thumb for "where does this file go":** if it renders something, it's a page or component. If it fetches, it's in `/api`. If it decides something (is this transition allowed? is this user allowed to do this?), it's a service or middleware. Nothing else is a valid fourth category for this project.

---

## 3. Backend Layering — Concrete Pattern

Every write endpoint follows this exact shape, no exceptions:

```
route (Express router)
  -> middleware: authenticate -> requireOwnerOrManager (if applicable)
  -> controller: validate request body against zod schema -> call service -> send response
  -> service: apply business rule -> call Prisma -> return domain object
  -> (errors thrown from service are typed AppError subclasses, caught by the one
     centralized error-handling middleware registered last in app.ts)
```

Example of the pattern for the stage-transition endpoint (illustrative, not literal code to copy verbatim):

```
opportunities.routes.ts:
  router.patch('/:id/stage', authenticate, opportunitiesController.transitionStage)

opportunities.controller.ts:
  async function transitionStage(req, res, next) {
    const body = stageTransitionSchema.parse(req.body)   // throws ValidationError on bad input
    const updated = await opportunitiesService.transitionStage(req.user, req.params.id, body)
    res.json(updated)
  }

opportunities.service.ts:
  async function transitionStage(user, opportunityId, { toStage, lostReason }) {
    const opp = await findOwnedOrThrow(user, opportunityId)   // throws NotFoundError (see PRD §7)
    assertValidTransition(opp.stage, toStage, lostReason)     // throws InvalidTransitionError
    return prisma.opportunity.update(...)
  }
```

This is the **only** pattern used across Leads, Opportunities, Customers, and Activities. Do not invent a different shape for one resource "because it's simpler" — consistency across all four is more valuable than a locally-shorter implementation.

---

## 4. Frontend Pattern

- **Data fetching:** a small typed function per endpoint in `/api` (e.g. `getLeads(params)`, `convertLead(id)`). Pages call these directly with `useEffect`/`useState` or a minimal fetch hook — do not introduce React Query or SWR for an app this size unless the agent judges the loading/error/refetch boilerplate has become genuinely repetitive (rule of three, Section 1.3).
- **Every page that fetches data has exactly three render branches:** loading, error, and success (which itself may render the empty state). No page should be able to render in an undefined fourth state.
- **Forms:** plain controlled inputs + a validation function per form that mirrors the zod schema on the backend (same rules, both places — see PRD §7). Do not add a form library for the ~5 forms this project has.
- **Styling:** pick one approach (plain CSS modules or a minimal utility approach) and use it uniformly across all 9 screens. Do not mix approaches page-to-page.

---

## 5. Standards Reference

### 5.1 Naming
| Thing | Convention | Example |
|---|---|---|
| Files (backend) | kebab-case, `.<layer>.ts` suffix | `leads.service.ts` |
| Files (frontend) | PascalCase for components/pages | `LeadDetail.tsx` |
| Functions/variables | camelCase, verb-first for functions | `getLeadsForUser`, `isEligibleForConversion` |
| Types/interfaces | PascalCase, no `I` prefix | `Lead`, `LeadCreateRequest` |
| DB tables/columns | snake_case (Prisma maps to camelCase in code) | `next_follow_up_date` |
| Constants/enums | PascalCase for enum, UPPER_SNAKE for true constants | `OpportunityStage.Won`, `MAX_PAGE_SIZE` |

### 5.2 Validation
- One zod schema per write endpoint, named to match the API spec's request schema (`LeadCreateRequest`, `StageTransitionRequest`, etc.) — names should be greppable against `CRM_API_Spec.yaml`.
- Validation happens **once**, at the controller boundary, using the schema. Services trust their inputs are already valid — they do not re-validate, only re-check business state (ownership, current status).

### 5.3 Error Handling
- Define a small set of `AppError` subclasses matching the API spec's error codes: `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `InvalidStateError` / `InvalidTransitionError` (409).
- Every one of these carries the exact `error` code and `message` the API spec documents. One Express error-handling middleware maps `AppError` instances to the right status + JSON body, and maps anything else (a genuine bug) to a generic 500 with a logged stack trace server-side only.

### 5.4 Testing
- Test files mirror the Section 14 test list from the POC doc 1:1 — one `describe` block per resource, one `it` per numbered test case, named after the acceptance criterion it checks (not "test 1", "test 2").
- Tests run against a real (test) database via Prisma, seeded fresh per suite — no mocking the ORM.

---

## 6. Explicit Anti-Patterns (do not do these)

- **God files.** No `utils.ts` or `helpers.ts` that accumulates unrelated functions. Every helper lives next to the thing that uses it, or in `/lib` only if genuinely shared by 3+ callers across different resources.
- **Fat controllers.** If a controller function is doing `if/else` business logic beyond "call the service and shape the response," that logic belongs in the service.
- **Duplicated validation.** The ownership check ("is this my lead?") is written once, as `requireOwnerOrManager`, and reused across Leads/Opportunities/Activities — never re-implemented per route.
- **Inline SQL / raw queries.** Prisma only, matching the POC doc's "safe ORM" requirement.
- **Over-engineering for scale that doesn't exist.** No microservices, no message queue, no Redis cache, no GraphQL layer — the POC doc explicitly scoped these out (Section 6). Introducing them here would contradict the design doc for no benefit.
- **Silent catches.** `catch (e) {}` or `catch (e) { console.log(e) }` with no rethrow/handling is never acceptable — see Section 1.5.
- **Copy-pasted CRUD.** Leads, Opportunities, and Activities share the same list/get/ownership pattern. If a bug fix is being pasted into three files, that's a signal that the shared middleware (Section 3) isn't being used correctly — fix the shared piece, not each copy.

---

## 7. Phased Build Order & Definition of Done Per Phase

Each phase below must satisfy its **Clean Code Checklist** before moving to the next — do not proceed with unresolved lint errors, `any` types, or failing tests carried forward.

### Phase 1 — Foundation
- Repo scaffolding per Section 2, ESLint + Prettier configured and passing on an empty project, Prisma schema written matching POC doc §8, migrations run, seed script produces the dataset the PRD's dashboard math assumes.
- **Checklist:** `npm run lint` clean · `npx prisma validate` clean · seed script runs idempotently (safe to re-run).

### Phase 2 — Auth (PRD §6.1)
- Login, logout, JWT issuance/verification middleware, bcrypt hashing in the seed script (never plaintext).
- **Checklist:** wrong-password and inactive-account cases return the exact messages in PRD FR-1.1 · no password hash ever appears in a response payload (grep the codebase for `password` in any `res.json` call to confirm).

### Phase 3 — Leads (PRD §6.2)
- Full CRUD + list/filter/search + ownership scoping, using the exact layered pattern from Section 3.
- **Checklist:** a Rep cannot fetch another rep's lead by ID (manual curl/Postman check with two seeded users) · empty-filter-result state matches PRD FR-2.3's exact copy.

### Phase 4 — Conversion (PRD §6.2 FR-2.4)
- The atomic Lead→Customer+Contact+Opportunity transaction.
- **Checklist:** conversion is wrapped in a single Prisma `$transaction` (partial failure must not leave an orphaned Customer or Opportunity) · re-attempting conversion on an already-converted lead returns 409, not a duplicate.

### Phase 5 — Opportunities & Pipeline (PRD §6.3)
- Stage transitions with the transition table as a single, testable, pure function (no DB calls inside the transition-validation function itself — a private detail worth getting right, since it's what makes it trivially unit-testable).
- **Checklist:** every entry in POC doc §10's diagram has a corresponding test case, both the allowed and a rejected transition.

### Phase 6 — Customers & Activities (PRD §6.4–6.5)
- Contact person management with the single-primary-contact invariant enforced server-side (not just assumed from the UI).
- **Checklist:** adding a second `isPrimary: true` contact un-marks the first, verified by a test, not just by inspection.

### Phase 7 — Dashboard (PRD §6.6)
- Aggregation queries per POC doc §11, role-scoped response shape per API spec.
- **Checklist:** Manager's `perRep` array sums to exactly the Manager's own top-level totals (this is the PRD's own Definition-of-Done item — write it as an actual test, not a manual check).

### Phase 8 — Frontend Assembly
- Build pages in the same order as the backend phases above, wiring each screen to its now-working API. Apply the three-render-branch rule (Section 4) to every page.
- **Checklist:** every one of the 9 screens in PRD §5 has a working loading, empty, and error state — verified by manually forcing each (e.g., throttle network, seed a zero-data account, kill the API mid-request).

### Phase 9 — Test Suite & Polish Pass
- Fill out the 7+ test cases from POC doc §14 if not already written alongside their phases.
- Full lint/typecheck pass, dead-code sweep (unused exports, unused deps in `package.json`), README finalized.
- **Checklist:** Section 12 below, in full.

---

## 8. Git Discipline

- Commit at the end of each phase (or sub-step within a phase), not as one giant commit at the end. Each commit should leave the app in a working, lintable state.
- Commit messages: `<type>: <what>` — `feat: add lead conversion transaction`, `fix: enforce single primary contact per customer`, `test: add stage-transition rejection cases`. No `wip`, `fix stuff`, or `final final v2` messages.
- No generated files (`node_modules`, `dist`, `.env`) committed — verify `.gitignore` covers them before the first commit, not after.

---

## 9. Final Pre-Demo Clean Code Audit

Run through this list once, at the very end, before considering the project done:

- [ ] Zero ESLint warnings or errors, zero TypeScript `any`, zero unused imports/variables.
- [ ] Zero `console.log` left in application code (test files and the seed script's own status output are fine).
- [ ] Zero commented-out code blocks anywhere in the diff.
- [ ] Every file is under ~200 lines; every function under ~30 lines. Anything larger has a specific, defensible reason noted in a one-line comment.
- [ ] `package.json` dependencies match what's actually imported somewhere — no leftover packages from an abandoned approach.
- [ ] Re-read every file name against Section 5.1 — nothing named `temp`, `test2`, `newLeads`, or similar.
- [ ] The 7+ tests all pass with one command, on a clean checkout, with no manual setup steps beyond what the README documents.
- [ ] README's "Known Limitations" section honestly lists anything cut for time — per the original assignment's own instruction to "mention unfinished items honestly."

If every box here is checked, the codebase is at the bar this document is asking for: not large, not clever — just clean enough that nothing about it needs explaining.
