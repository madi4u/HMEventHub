# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Planned** - Requirements written, ready for development
- **In Progress** - Currently being built
- **In Review** - QA testing in progress
- **Deployed** - Live in production

## Features

| ID | Feature | Status | QA | Spec | Created |
|----|---------|--------|-----|------|---------|
| PROJ-1 | Auth & Rollenmodell | In Review | **PARTIAL** - Middleware missing (CRITICAL), no is_active check | [PROJ-1](PROJ-1-auth-rollenmodell.md) | 2026-03-29 |
| PROJ-2 | Mandanten & Benutzerverwaltung | In Review | **PARTIAL** - No role change/deactivate UI, no invite flow | [PROJ-2](PROJ-2-mandanten-benutzerverwaltung.md) | 2026-03-29 |
| PROJ-3 | Veranstaltungen CRUD | In Review | **PARTIAL** - No edit page, no card view, search incomplete | [PROJ-3](PROJ-3-veranstaltungen-crud.md) | 2026-03-29 |
| PROJ-4 | Veranstaltungsdetailseite | In Review | **PARTIAL** - No tab URL state, internal_notes data leak risk | [PROJ-4](PROJ-4-veranstaltungsdetailseite.md) | 2026-03-29 |
| PROJ-5 | Mitarbeiter-Zuordnung zu Events | In Review | **PASS** - Minor: no remove confirmation, no phone display | [PROJ-5](PROJ-5-mitarbeiter-zuordnung.md) | 2026-03-29 |
| PROJ-6 | Meine Veranstaltungen (Mitarbeiter) | In Review | **PARTIAL** - Hardcoded German, no time tracking tab | [PROJ-6](PROJ-6-meine-veranstaltungen.md) | 2026-03-29 |
| PROJ-7 | Kassenblatt | In Review | **PARTIAL** - Storage bucket mismatch, wrong status on submit | [PROJ-7](PROJ-7-kassenblatt.md) | 2026-03-29 |
| PROJ-8 | Zeiterfassung | In Review | **PARTIAL** - Break state not persisted, no approve UI | [PROJ-8](PROJ-8-zeiterfassung.md) | 2026-03-29 |
| PROJ-9 | Onboarding-Modul | In Review | **PARTIAL** - No product pass UI, hardcoded German | [PROJ-9](PROJ-9-onboarding.md) | 2026-03-29 |
| PROJ-10 | Master-Dashboard | In Review | **PARTIAL** - Placeholder stats, hardcoded German | [PROJ-10](PROJ-10-master-dashboard.md) | 2026-03-29 |
| PROJ-11 | Inventurmodul | In Review | **PARTIAL** - No consumption calc UI, hardcoded German | [PROJ-11](PROJ-11-inventurmodul.md) | 2026-03-29 |
| PROJ-12 | Kontrollblatter / Checklisten | In Review | **PARTIAL** - Template CRUD UI needs verification | [PROJ-12](PROJ-12-kontrollblaetter.md) | 2026-03-29 |
| PROJ-13 | Feed / Dokumentations-Chat | In Review | **PARTIAL** - No empty-input validation, no pagination | [PROJ-13](PROJ-13-feed.md) | 2026-03-29 |
| PROJ-14 | PDF-Export Veranstaltung | In Review | **PARTIAL** - HTML not PDF, XSS vulnerability (CRITICAL) | [PROJ-14](PROJ-14-pdf-export-veranstaltung.md) | 2026-03-29 |
| PROJ-15 | PDF-Export Kassenblatt | In Review | **PARTIAL** - HTML not PDF, XSS, no signature/photo in export | [PROJ-15](PROJ-15-pdf-export-kassenblatt.md) | 2026-03-29 |
| PROJ-16 | Produkte / Artikelstamm | In Review | **PARTIAL** - Minor role scope issue | [PROJ-16](PROJ-16-produkte-artikelstamm.md) | 2026-03-29 |
| PROJ-17 | Logistik-Stammdaten | In Review | **PARTIAL** - Hardcoded German labels | [PROJ-17](PROJ-17-logistik-stammdaten.md) | 2026-03-29 |
| PROJ-18 | Mehrsprachigkeit | In Review | **FAIL** - i18n infrastructure built but not used in 90%+ of pages | [PROJ-18](PROJ-18-mehrsprachigkeit.md) | 2026-03-29 |
| PROJ-19 | Superadmin-Bereich | In Review | **PARTIAL** - CRUD operations incomplete | [PROJ-19](PROJ-19-superadmin.md) | 2026-03-29 |
| PROJ-20 | Dokumentenverwaltung pro Event | In Review | **PARTIAL** - Employee delete policy gap | [PROJ-20](PROJ-20-dokumentenverwaltung.md) | 2026-03-29 |

<!-- Add features above this line -->

## QA Summary (2026-03-29)

### Overall Results
- **PASS:** 1 (PROJ-5)
- **PARTIAL:** 18 (PROJ-1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,19,20)
- **FAIL:** 1 (PROJ-18)
- **Total Bugs Found:** 68 (BUG-001 through BUG-068)

### CRITICAL / P0 Bugs (Fix Immediately)
| Bug | Feature | Description |
|-----|---------|-------------|
| BUG-001 | PROJ-1 | **Middleware not active** -- `src/proxy.ts` exists but no `middleware.ts` at project root. Next.js middleware never runs. Route protection depends entirely on per-page checks. |
| BUG-002 | PROJ-1 | **Deactivated users can still log in** -- no `is_active` check during login flow |
| BUG-048 | PROJ-14 | **XSS in PDF export** -- user-supplied data (event title, notes, contacts) injected into raw HTML template without sanitization |
| BUG-053 | PROJ-15 | **XSS in cash report PDF export** -- same vulnerability as BUG-048 |
| BUG-062 | PROJ-18 | **i18n not wired up** -- translation files complete but 90%+ of pages use hardcoded German strings instead of `t()` calls |

### HIGH Priority Bugs
| Bug | Feature | Description |
|-----|---------|-------------|
| BUG-005 | PROJ-2 | No UI to change user roles |
| BUG-006 | PROJ-2 | No UI to deactivate users |
| BUG-008 | PROJ-2 | No user invitation flow |
| BUG-009 | PROJ-3 | No event edit page (linked but 404) |
| BUG-015 | PROJ-4 | Employee can access `/events/[id]` directly -- sees manager view |
| BUG-024 | PROJ-7 | Submit sets SUBMITTED not FINAL; no finalization mechanism |
| BUG-025 | PROJ-7 | Storage bucket name mismatch -- uploads will fail |
| BUG-029 | PROJ-8 | Break state not persisted to DB -- lost on refresh |
| BUG-047 | PROJ-14 | Export generates HTML not PDF |
| BUG-052 | PROJ-15 | Export generates HTML not PDF |

### Security Audit Summary
- [x] RLS enabled on all 30 tables -- PASS
- [x] Tenant isolation via `my_tenant_id()` helper function -- PASS
- [x] No hardcoded secrets in source code -- PASS (uses env vars)
- [x] No `dangerouslySetInnerHTML` usage -- PASS
- [x] File upload validation (type + size) via storage bucket config -- PASS
- [ ] **FAIL**: Middleware not active -- unauthenticated route blocking relies on per-page checks only
- [ ] **FAIL**: No `is_active` check blocks deactivated users
- [ ] **FAIL**: XSS in PDF export API routes -- user data injected into raw HTML
- [ ] **FAIL**: `internal_notes` fetched from DB for all users on `/events/[id]` (hidden by UI only, data in server response)
- [ ] **FAIL**: Cash report page has no server-side auth check (client component)
- [ ] **PARTIAL**: Server-side role checks present on most pages but not all (cash reports page missing)
- [ ] **PARTIAL**: Employee-facing fields properly filtered on `/my-events/[id]` but not on `/events/[id]`

## Next Available ID: PROJ-21
