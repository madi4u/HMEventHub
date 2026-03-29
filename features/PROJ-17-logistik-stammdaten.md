# PROJ-17: Logistik-Stammdaten

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-2 (Mandanten)
- Requires: PROJ-3 (Veranstaltungen)

## User Stories
- Als Owner möchte ich Fahrzeuge, Foodtrucks, Kühlwagen und Equipment zentral verwalten.
- Als Owner möchte ich einer Veranstaltung bestimmte Fahrzeuge/Foodtrucks zuweisen.
- Als Mitarbeiter möchte ich in der Veranstaltungsansicht sehen, welches Fahrzeug/Foodtruck zugewiesen ist.

## Acceptance Criteria
- [ ] Logistik-Seite mit Tabs: Fahrzeuge, Foodtrucks, Kühlwagen, Equipment
- [ ] Fahrzeug: Name, Kennzeichen, Typ, Status (ACTIVE/INACTIVE/IN_REPAIR), Notizen
- [ ] Foodtruck: Name, Typ, Status, Notizen
- [ ] Kühlwagen: Name, Status, Notizen
- [ ] Equipment: Name, Kategorie, Status, Notizen
- [ ] Veranstaltungs-Logistik-Tab: Zuweisung von Fahrzeug/Foodtruck/Kühlwagen per Dropdown
- [ ] Status IN_REPAIR visuell hervorgehoben (gelb/orange Badge)
- [ ] Nur OWNER/TENANT_ADMIN/ADMIN dürfen Stammdaten verwalten

## Edge Cases
- Fahrzeug IN_REPAIR aber für Event zugewiesen → Warnung bei Zuweisung, aber erlaubt
- Fahrzeug löschen das einem Event zugewiesen ist → nur deaktivieren, nicht löschen

## Technical Requirements
- `vehicles`, `foodtrucks`, `cooling_trailers`, `equipment` Tabellen mit `tenant_id`
- `event_logistics_assignments` für Zuweisung zu Events (1:1 pro Event)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Logistics page with tabs: Vehicles, Foodtrucks, Cooling Trailers, Equipment | PASS | `/logistics` page exists, i18n keys for all 4 categories present |
| 2 | Vehicle: name, license plate, type, status, notes | PASS | `vehicles` table schema correct, fields in types |
| 3 | Foodtruck: name, type, status, notes | PASS | Schema and types correct |
| 4 | Cooling trailer: name, status, notes | PASS | Schema and types correct |
| 5 | Equipment: name, category, status, notes | PASS | Schema and types correct |
| 6 | Event logistics tab: assign vehicle/foodtruck/cooling trailer | PASS | `EventLogisticsTab` component exists, `event_logistics_assignments` table |
| 7 | IN_REPAIR status highlighted | PARTIAL | Status type includes IN_REPAIR but visual highlighting not verified in UI |
| 8 | Only OWNER/TENANT_ADMIN/ADMIN can manage | PASS | RLS `admin_manage_vehicles` etc. restrict writes to admins |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-061 | **LOW** | Hardcoded German labels on logistics page | P2 |

### Security Notes
- RLS: all logistics tables have `tenant_view_*` for read and `admin_manage_*` for write.
- `event_logistics_assignments` properly scoped by tenant + event manager role.

## Deployment
_To be added by /deploy_
