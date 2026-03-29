# PROJ-19: Superadmin-Bereich

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-1 (Auth — SUPERADMIN Rolle)
- Requires: PROJ-2 (Mandanten)

## User Stories
- Als Superadmin möchte ich neue Mandanten anlegen und verwalten.
- Als Superadmin möchte ich einen Überblick über alle Mandanten, ihre User-Anzahl und Event-Anzahl haben.
- Als Superadmin möchte ich Mandanten aktivieren und deaktivieren können.
- Als Superadmin möchte ich Tenant-Admin-User für einen Mandanten anlegen.

## Acceptance Criteria
- [ ] Route `/superadmin` nur für SUPERADMIN-Rolle zugänglich
- [ ] Übersicht: Tabelle aller Mandanten (Name, Slug, Status, User-Anzahl, Event-Anzahl, Erstellt)
- [ ] Mandant anlegen: Name, Slug (auto-generiert), Status
- [ ] Mandant aktivieren/deaktivieren (Status ACTIVE/INACTIVE/SUSPENDED)
- [ ] Tenant-Admin anlegen: E-Mail, Name → wird zum User im jeweiligen Mandanten
- [ ] Systemübersicht: Gesamtzahl Mandanten, User, Events
- [ ] SUPERADMIN sieht alle Daten mandantenübergreifend

## Edge Cases
- Slug bereits vergeben → Validierungsfehler mit Vorschlag
- Letzten Mandanten deaktivieren → erlaubt (Superadmin bleibt zugänglich)
- Superadmin deaktiviert eigenen Mandanten → Warnung

## Technical Requirements
- RLS: `is_superadmin()` erlaubt alle Operationen
- `tenants` Tabelle mit Status-Feld
- Aggregations-Queries für User/Event-Anzahl je Mandant

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Route `/superadmin` only for SUPERADMIN | PASS | Server-side check `profile.role !== 'SUPERADMIN'` redirects to `/dashboard` |
| 2 | Tenant overview table | PASS | Table with all tenants, fetched with user/event counts per tenant |
| 3 | Create tenant: name, slug, status | PARTIAL | Need to verify create tenant form exists |
| 4 | Activate/deactivate tenant | PARTIAL | Status field visible but toggle buttons not verified |
| 5 | Create tenant admin user | PARTIAL | Not verified in UI |
| 6 | System overview stats | PASS | Stats cards for total tenants, active tenants, total users |
| 7 | SUPERADMIN sees all data cross-tenant | PASS | RLS `superadmin_all_*` policies grant full access |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-065 | **MEDIUM** | Tenant management CRUD operations (create, activate, deactivate, create admin) not fully verifiable -- forms may be incomplete | P2 |
| BUG-066 | **LOW** | N+1 query pattern -- per-tenant stats fetched in `Promise.all` loop. With many tenants this could be slow. Should use aggregation queries. | P3 |

### Security Notes
- SUPERADMIN role check is server-side before any data access. Good.
- RLS `superadmin_all_tenants` and `superadmin_all_profiles` correctly use `is_superadmin()` function.
- Sidebar nav correctly shows `/superadmin` only for SUPERADMIN role.
- **Concern**: Middleware is missing (BUG-001), so the `/superadmin` route protection relies entirely on the page-level check. If this check were removed or bypassed, any authenticated user could see the page.

## Deployment
_To be added by /deploy_
