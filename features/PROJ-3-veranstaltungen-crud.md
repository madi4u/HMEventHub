# PROJ-3: Veranstaltungen CRUD

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-1 (Auth & Rollenmodell)
- Requires: PROJ-2 (Mandanten & Benutzerverwaltung)

## User Stories
- Als Owner möchte ich eine neue Veranstaltung anlegen mit Titel, Datum, Ort, Typ und Status.
- Als Owner möchte ich mehrtägige Veranstaltungen anlegen und das System soll automatisch für jeden Tag einen Event-Tag anlegen.
- Als Owner möchte ich bestehende Veranstaltungen bearbeiten und den Status ändern.
- Als Owner möchte ich Veranstaltungen in einer Übersicht nach Datum sehen, filtern und suchen.
- Als Event Manager möchte ich Veranstaltungen anlegen und verwalten.
- Als Mitarbeiter darf ich keine Veranstaltungen anlegen oder löschen.

## Acceptance Criteria
- [ ] Veranstaltungsübersicht zeigt alle Events des Mandanten sortiert nach Datum
- [ ] Filter nach Status (DRAFT, CONFIRMED, ACTIVE, COMPLETED, CANCELLED)
- [ ] Filter nach Veranstaltungstyp (Festival, Firmenevent, Privat, Markt, Catering, Sonstige)
- [ ] Freitextsuche nach Titel und Ort
- [ ] Karten- und Tabellenansicht umschaltbar
- [ ] Neue Veranstaltung: Multi-Step-Formular (Grunddaten → Ort & Kontakt → Hinweise)
- [ ] Beim Anlegen: automatische Generierung eines Event-Tags pro Veranstaltungstag (`event_days`)
- [ ] Pflichtfelder: Titel, Veranstaltungstyp, Start- und Enddatum
- [ ] Bearbeiten: alle Felder änderbar, Status änderbar
- [ ] Kommende Events hervorgehoben in der Übersicht
- [ ] Nur OWNER/TENANT_ADMIN/EVENT_MANAGER dürfen Events anlegen/bearbeiten
- [ ] EMPLOYEE sieht diese Seite nicht (Sidebar-Nav versteckt)

## Edge Cases
- Enddatum vor Startdatum → Validierungsfehler
- Event mit nur einem Tag → genau 1 Event-Tag angelegt
- Event über Monatswechsel → korrekte Event-Tage für alle Tage
- Event wird nach Anlegen editiert, Datumsbereich erweitert → neue Event-Tage nachgenerieren
- Event-Tage löschen wenn Datum gekürzt wird → nur möglich wenn kein Kassenblatt/Zeiterfassung daran hängt

## Technical Requirements
- Server Action `createEvent()` generiert automatisch `event_days` für jeden Tag im Zeitraum
- `event_days.day_label` = "Tag 1", "Tag 2" etc. (oder Wochentag)
- Validierung mit Zod (Datum, Pflichtfelder)
- RLS: nur eigener Mandant, nur berechtigte Rollen

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Event overview shows all tenant events sorted by date | PASS | `/events` page queries events by `tenant_id`, `order('start_date', { ascending: false })` |
| 2 | Filter by status | PASS | `searchParams.status` applied as `.eq('status', params.status)` |
| 3 | Filter by event type | PASS | `searchParams.type` applied as `.eq('event_type', params.type)` |
| 4 | Free text search by title and location | PARTIAL | Only searches by `title` via `.ilike('title', ...)`. City/location not included in search. |
| 5 | Card and table view toggle | **FAIL** | Only table view implemented. No card view toggle. |
| 6 | Multi-step form for new event | PASS | 4-step wizard: Grunddaten, Ort & Kontakt, Team & Logistik, Hinweise |
| 7 | Auto-generate event_days on creation | PASS | `generateDateRange()` creates days, inserts into `event_days` with `day_label = "Tag X"` |
| 8 | Required fields: title, type, start/end date | PASS | Zod schema requires these fields |
| 9 | Edit: all fields changeable | **FAIL** | No edit page exists -- `/events/[id]/edit` is linked but route file not found |
| 10 | Upcoming events highlighted | PARTIAL | No visual distinction in events list for upcoming vs past |
| 11 | Only OWNER/TENANT_ADMIN/EVENT_MANAGER can create/edit | PASS | `isManagerRole()` check redirects non-managers |
| 12 | EMPLOYEE cannot see events page | PASS | Sidebar hides `/events` for EMPLOYEE role; server check redirects |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-009 | **HIGH** | No event edit page -- link to `/events/[id]/edit` exists in detail page header but the route does not exist (will 404) | P0 |
| BUG-010 | **MEDIUM** | No card view toggle -- only table view implemented, spec requires switchable card/table | P2 |
| BUG-011 | **MEDIUM** | Search only covers title, not city/location as specified | P2 |
| BUG-012 | **LOW** | End date before start date not validated in Zod schema (no `.refine()` cross-field check) | P1 |
| BUG-013 | **MEDIUM** | Event date range change after creation does not regenerate event_days -- no edit page, so edge case untestable | P1 |
| BUG-014 | **LOW** | Events page labels are hardcoded in German, not using i18n `t()` function | P2 |

### Security Notes
- Events page server-side role check correctly prevents EMPLOYEE access.
- RLS policy `managers_manage_events` requires both `tenant_id = my_tenant_id()` AND `is_event_manager()`. Good.
- New event form runs on client, creates event via Supabase client -- relies on RLS for authorization. RLS is correctly configured.

## Deployment
_To be added by /deploy_
