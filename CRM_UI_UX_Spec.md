# UI/UX Upgrade Spec
## CRM / Sales Management Portal — Making It Feel Like a Real Product

**Context:** Phase 11 fixed the visual language (soft white neomorphism, real design tokens instead of unstyled defaults) and the seed data. This doc is the next layer on top: the app is now *styled* but still reads as a functional shell rather than something a team actually lives inside. This spec closes that gap with six concrete, scoped changes — not a redesign, an inhabitation pass.

**Scope boundary:** everything in this doc applies to the **authenticated app only** (the 9 screens in `CRM_PRD.md` Section 5). It does NOT apply to the public `ridgeline_landing.html` page, which has its own separate visual identity and already serves the "what is this product" role — do not add explanatory/marketing copy inside the logged-in app; that would look more like a tutorial, not less.

**Priority legend:** P0 = do this, it's the highest-leverage change per hour of work. P1 = do this if P0 is solid. P2 = real, but the lowest-leverage of the six — cut first if time runs short.

---

## Design Tokens (unchanged from Phase 11 — restated here for reference)

```css
:root {
  --bg: #ECEFF3;
  --ink: #2B303B;
  --slate: #6B7280;
  --accent: #4C6FFF;
  --accent-ink: #FFFFFF;
  --success: #2F9E6E;
  --danger: #D65C5F;
  --line: rgba(43,48,59,0.08);
  --shadow-light: #FFFFFF;
  --shadow-dark: rgba(163,177,198,0.55);
  --radius: 16px;
  --radius-sm: 10px;
}
```
`.raised` and `.inset` classes are as defined in Phase 11 — reuse them, do not redefine.

---

## A. Sidebar Navigation (replaces the current top nav) — P0

**Why:** a top text-link nav reads like a documentation site. A persistent left sidebar with icons is the single most recognizable "this is a real workspace tool" signal across Pipedrive, HubSpot, Close, and Attio — it changes the silhouette of every screen at once, which is the highest visual impact per hour of any change in this doc.

**Structure:**
- Fixed left sidebar, 240px wide, full viewport height, `background: var(--bg)`, 1px right border in `var(--line)` (flat — do NOT apply a `.raised` shadow to the whole sidebar; a shadow down the entire left edge is heavy, not clean).
- Top of sidebar: product mark + name ("CRM · Sales Management Portal" or similar), same as current, just rotated into the sidebar.
- Below that: a full-width primary button, "+ New Lead" (Manager-only), styled per the existing `.raised` accent-button spec — this replaces the current top-nav "+ New Lead" link with something that actually looks like the primary action it is.
- Nav items below, each: icon (16-18px, consistent stroke-width icon set — reuse whatever icon set is already imported for the app, e.g. lucide-react; do not mix icon styles) + label. Items: Dashboard, Leads, Pipeline, Team (Manager-only, hidden entirely for Reps — not shown-and-disabled).
- Active item: `var(--accent)` text + icon, a soft accent-tinted pill background (`var(--accent)` at ~10% opacity), and a 3px accent-colored bar on the item's left edge.
- Inactive items: `var(--slate)` text + icon, no background. Hover: `var(--ink)` text, faint `var(--bg)`-darkened background (a few % darker, not a shadow).

**New top bar** (replaces the old full nav bar, now sits to the right of the sidebar, spanning the remaining width):
- Left side: empty or a breadcrumb-style page title (optional, low priority).
- Right side, in order: a search input (see Section E — even before the full command palette ships, this can just be a plain input styled per `.inset`, linking to Section E once that's built), then the user's **avatar** (Section B) + name + role pill, then Logout.
- Flat, `var(--bg)` background, 1px bottom border in `var(--line)` — same restraint rule as before, no shadow on a full-width bar.

**Acceptance check:** every one of the 9 authenticated screens uses this same sidebar + top bar shell — verify none of them still render the old top-link nav.

---

## B. Avatar System — P0

**Why:** plain text names next to numbers is the fastest way for a UI to read as "a spreadsheet with CSS." A small colored initial-avatar next to every person's name is what makes rows feel like they represent real humans.

**Component spec:**
- Circular, deterministic background color derived from a hash of the person's name (a small fixed palette of 6-8 muted tones works fine — do not use `var(--accent)` for these, reserve that color for actions/active states only, per the existing restraint rule).
- Initials: first letter of first name + first letter of last name, uppercase, `var(--ink)` or white text depending on contrast against the generated background.
- Three sizes: `sm` (24px, for table rows and activity-feed entries), `md` (32px, for list views and the top-bar user avatar), `lg` (40px, for detail-page headers — e.g. the primary contact on Customer Detail, or the owning rep on Opportunity Detail).

**Where it must appear (this is the actual list — implement all of them, this is what makes the change register):**
- Leads table: a small avatar next to the assigned rep's name (you'll need to surface the owner's name in this table if it isn't already a column — check PRD FR-2.3, ownership is core to this screen).
- Team page: avatar next to each rep's name in the directory.
- Dashboard's per-rep breakdown table: avatar next to each rep name.
- Customer Detail: avatar next to each Contact Person (primary contact gets the `lg` size at the top of the profile, others `md` in the contact list).
- Activity timeline entries: `sm` avatar of whoever logged the activity, next to their name and timestamp.
- Opportunity Detail: avatar next to the owning rep's name.
- Top bar: the current logged-in user's own avatar next to their name.

**Acceptance check:** grep the frontend for any place a person's name is rendered as plain text without an adjacent avatar in the list above — there shouldn't be any left.

---

## C. Toast / Confirmation System — P0

**Why:** right now, actions probably just... happen, with no visible confirmation. In a live demo, a reviewer clicking "Update Stage" and seeing *nothing* change on screen except a number reads as "did that even work?" — this is a trust gap, not a cosmetic one.

**Component spec:**
- A single, reusable toast component/hook (e.g. `useToast()` or a small context provider) — do not implement ad-hoc alert logic per page (Implementation Plan Section 1.3's rule of three applies retroactively here: this is exactly the kind of shared piece that should exist once).
- Position: bottom-right, stacking upward if multiple fire in quick succession.
- Style: `.raised` neomorphic card, `--success` (green) left accent bar + checkmark icon for success, `--danger` (red) left accent bar + alert icon for errors.
- Auto-dismiss after ~4 seconds, with a manual close (×) available immediately.

**Trigger it after every one of these mutations (this is the full list — every meaningful write action in the app):**
- Lead created → "Lead created for {companyName}"
- Lead updated → "Lead updated"
- Lead disqualified → "Lead marked as disqualified"
- Lead converted → "Converted to customer — opportunity created" (fires right before/during the redirect to Opportunity Detail)
- Opportunity stage updated → "Moved to {stageName}" (or "Marked as Lost" / "🎉 Marked as Won" for the terminal cases — a slightly warmer message for Won is a nice, cheap touch)
- Contact person added → "Contact added"
- Activity logged → "Activity logged"
- Rep activated/deactivated (Team page) → "{repName} activated" / "{repName} deactivated"
- Any failed mutation → the API's actual `message` field (per `CRM_API_Spec.yaml`'s Error schema) shown as a danger toast, not a silent console error

**Acceptance check:** perform each action above once in the running app and confirm a toast fires with the exact copy pattern above, and that a deliberately-triggered failure (e.g. an invalid stage transition) shows the real API error message, not a generic one.

---

## D. Designed Empty & First-Login States — P1

**Why:** the current dashboard for a near-empty account is just a wall of "0"s and "N/A" — this is the loudest "this is an MVP shell" signal in the whole app, independent of the CSS quality around it.

**Specific states to design (not just leave blank/zero):**
1. **Dashboard, zero-data state** (brand new rep or before seed data existed): instead of bare 0s, wrap each metric card's zero state in a short, calm sentence — "No leads assigned yet" instead of just "0" under "Open Leads"; "All caught up — nothing due today" instead of bare "0" under Follow-ups Due; "No deals closed yet this month" instead of "N/A" for conversion rate (N/A is fine to keep as the *number*, but pair it with that sentence underneath).
2. **Leads List, zero filter results** (already specified in PRD FR-2.3 — implement exactly as written there if not already done): "No leads match these filters" + a "Clear filters" action.
3. **Pipeline board, empty stage column**: keep "No deals" per column but style it as calm centered muted text within the `.inset` tray, not a jarring blank gap.
4. **Customer Detail, no activities yet**: "No activity logged yet — start with a call or note" instead of a blank timeline.
5. *(Nice-to-have, do only if A-C are solid and time remains):* a lightweight first-login checklist on the Dashboard when a Manager has zero leads in the whole system: "Get started — 1. Create your first lead 2. Assign it to a rep 3. Watch it move through the pipeline" with the first item linking straight to New Lead. This is the one item in this whole doc that's closest to "explaining the product" — keep it to 3 short steps, remove it (or don't show it) once the account has any real data, and do not add anything like this anywhere else in the app.

**Acceptance check:** seed a throwaway account with zero leads/opportunities and confirm none of the screens above show a bare 0/N/A/blank without the accompanying calm copy.

---

## E. Command Palette / Global Search — P2

**Why:** cheap signal of "built for people who live here all day" (Attio and Close both lean on this), but genuinely the lowest-leverage item in this doc for a recruiter watching a short demo. Build this last, and only if A-D are done.

**Spec (keep it simple — do not over-build this):**
- Triggered by `Cmd+K` / `Ctrl+K`, or by clicking the search input in the new top bar (Section A).
- A modal overlay with a single text input; searches across Lead company/contact names and Customer company names as the user types (debounced), showing results grouped under two headers ("Leads" / "Customers").
- Selecting a result navigates directly to that record's detail page and closes the palette.
- No fuzzy-matching library needed — a simple case-insensitive substring match against already-fetched or freshly-queried data is entirely sufficient for this app's data scale.

**Acceptance check:** `Cmd+K` opens the palette from any authenticated screen; typing part of a seeded company name returns it; selecting it navigates correctly.

---

## F. Minimal Settings/Profile Area — P2

**Why:** its total absence subtly reads as "temporary" — real products have somewhere your account "lives," even if it's nearly empty. Lowest priority in this doc; a small, deliberately minimal addition, not a new feature area.

**Spec (deliberately small — do not scope-creep this into a real settings system):**
- A single page reachable from the top-bar avatar (dropdown: "Profile", "Logout").
- Shows: name, email, role badge, account created date — read-only, per the current seeded user. No password-change flow, no editable fields — this is explicitly out of scope (see `CRM_PRD.md` Section 3 Non-Goals on auth flows).
- Styled with the same `.raised` card pattern as everything else — this page's entire value is existing, not doing anything elaborate.

**Acceptance check:** the page exists, is reachable, shows real seeded data, and nothing on it is editable or broken.

---

## Final Note for the Agent

Do these roughly in the order A → B → C → D → E → F. If you're going to run out of time, stop after D — A through D are the four items actually worth the hours; E and F are real but genuinely optional polish. Do not silently skip A-D to get to E/F; report explicitly if you're deprioritizing anything, the same way Phase 9's audit required explicit pass/fail per item rather than a summary claim.

## G. Precision Fixes — P0 (do these before touching Sections E or F)
 
These are exact-value corrections to gaps in Sections A-D that produced visible bugs: an unbounded phone field, inconsistent form spacing, a broken search, and a duplicated "+" on the New Lead button. Fix all four before doing anything else in this doc.
 
### G.1 Spacing Scale (apply everywhere, replacing ad-hoc margins)
 
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
}
```
 
**Fixed form field pattern — every form in the app uses exactly this, no exceptions:**
- Label: `margin-bottom: var(--space-2)` (8px) to its input. Font: `var(--slate)`, 13px, weight 500.
- Input/select height: 44px fixed, `padding: 0 var(--space-4)`.
- Gap between one field group (label+input) and the next: `margin-bottom: var(--space-5)` (24px) — this must be identical for every field in every form. The current Lead Edit form has visibly different gaps between different field pairs (tight, then wide, then tight) — that inconsistency is the "jumbled" look. After this fix, every gap between fields should be pixel-identical.
- Required-field asterisk: same color as the label, not a separate red — it's not an error state, don't style it like one.
### G.2 Field Validation Limits (currently missing — add these exact constraints)
 
| Field | Constraint |
|---|---|
| `contactPhone` | `maxLength=20`, and reject any character that isn't a digit, space, `+`, `-`, `(`, or `)` — enforce this both as an input mask (block invalid keystrokes) AND as a server-side zod regex, not just a UI limit |
| `companyName` / `contactName` | `maxLength=100` (currently unbounded — add this defensively even though it hasn't visibly broken yet) |
| `notes` (Activity) | keep the existing `minLength=3` from PRD Section 7, add `maxLength=1000` |
 
Audit every other text input in the app for the same "no maxLength at all" gap — the phone field is very unlikely to be the only one.
 
### G.3 Fix the Broken Search
 
The command palette returned "No results found" for a query that should have matched seeded data ("Velocity Automotive" or similar). Debug in this order and report which was the actual cause:
1. Confirm the search is calling the real backend — `GET /api/v1/leads?q=vel` and an equivalent customer search — not filtering a stale or empty local array.
2. Confirm the match is case-insensitive on both the query and the stored value (`ILIKE` in Postgres, or `.toLowerCase()` on both sides if filtering in JS).
3. Confirm the query param name and casing exactly match what the backend route actually reads (a mismatch like `?query=` vs `?q=` would silently return nothing without erroring).
4. Confirm the request actually fires — check for a debounce bug that cancels the request before it completes, or a missing `Authorization` header on this specific call causing a silent 401 that the UI swallows instead of surfacing as an error.
Fix the actual root cause, then verify by searching a partial substring of a real seeded company name and confirming it returns that lead/customer.
### G.4 Fix the Duplicated "+" on New Lead
 
The button currently renders as "+ + New Lead" — an icon plus-sign placed in front of a label that still literally contains its own "+" character. Fix: the button's TEXT label must be exactly `New Lead` (no plus character in the string at all). The plus symbol appears exactly once, as a real icon component (from whatever icon set is already imported — e.g. `<Plus />` from lucide-react), never as a typed `+` character in a string. Audit the rest of the app for the same pattern — anywhere a button combines an icon with a label, confirm the label text doesn't also contain a redundant symbol.
 
### G.5 Disabled Field Style (seen on the Lead Status dropdown for a Converted lead)
 
Add explicit disabled-state tokens rather than an ad-hoc faint grey with poor contrast:
```css
--disabled-bg: rgba(43,48,59,0.04);
--disabled-text: rgba(43,48,59,0.45);
```
Any disabled input/select uses these exactly, everywhere — the current disabled "New" status field is low-contrast enough to look broken rather than intentionally locked. Also add a small inline note under a disabled field explaining *why* it's locked (e.g., "Status can't be changed after conversion") — a disabled field with no explanation looks like a bug, one with a one-line reason looks like a deliberate rule.
 
**Acceptance check for this whole section:** re-view the exact three screenshots that prompted this section — the phone field should now hard-stop at a reasonable length, every label-to-input and field-to-field gap in the Lead Edit form should be visually identical, searching a real seeded company name should return it, and the New Lead button should show exactly one plus sign.