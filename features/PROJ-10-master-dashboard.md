# PROJ-10: Master-Dashboard

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-3 (Veranstaltungen)
- Requires: PROJ-7 (Kassenblatt)
- Requires: PROJ-8 (Zeiterfassung)

## User Stories
- Als Owner möchte ich auf einen Blick sehen: kommende Events, offene Kassenblätter, fehlende Zeiterfassungen.
- Als Owner möchte ich den Tages- und Gesamtumsatz pro Veranstaltung sehen.
- Als Owner möchte ich sofort erkennen, wo Handlungsbedarf besteht (fehlende Einreichungen).
- Als Event Manager möchte ich das Dashboard ebenfalls sehen.

## Acceptance Criteria
- [ ] Stats-Cards: Kommende Events (Anzahl), Aktive Events, Offene Kassenblätter, Fehlende Zeiterfassungen
- [ ] Sektion "Nächste Veranstaltungen": 5 nächste Events mit Datum, Typ, Status, Ort
- [ ] Sektion "Offene Kassenblätter": Liste Events mit fehlendem/offenem Kassenblatt
- [ ] Sektion "Letzte Aktivitäten": aus `activity_logs`
- [ ] Umsatzübersicht: Tagesumsatz pro abgeschlossenem Kassenblatt
- [ ] Klickbare Karten → direkt zur Veranstaltungsdetailseite
- [ ] Nur für OWNER/TENANT_ADMIN/EVENT_MANAGER sichtbar
- [ ] EMPLOYEE sieht dieses Dashboard nicht

## Edge Cases
- Keine Events vorhanden → leerer Zustand mit Aufforderung erstes Event anzulegen
- Alle Kassenblätter abgeschlossen → Sektion zeigt "Alles erledigt"
- Dashboard bei vielen Events performant (Pagination / Limit Queries)

## Technical Requirements
- Server Component mit parallelen Supabase-Queries
- Aggregation: `SUM(total_amount)` aus `cash_reports` mit Status FINAL
- Rollenprüfung serverseitig vor Datenabruf

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Stats cards: upcoming, active, open cash reports | PASS | 6 stats cards rendered with parallel Supabase queries |
| 2 | Next events section (5 next) | PASS | Queries events with `start_date >= today`, limit 5, sorted ascending |
| 3 | Open cash reports section | PASS | Queries cash_reports with `status != FINAL`, limit 5 |
| 4 | Recent activity section | PASS | Queries `activity_logs` with 7-day window, limit 10 |
| 5 | Revenue overview | PARTIAL | Shows "Offener Betrag" from non-final reports, but not total finalized revenue per spec |
| 6 | Clickable cards to event detail | PASS | `Link href={/events/${event.id}}` on each event card |
| 7 | Only for OWNER/TENANT_ADMIN/EVENT_MANAGER | PASS | Server-side check `MANAGER_ROLES.includes(profile.role)`, redirects to `/my-events` |
| 8 | EMPLOYEE cannot see dashboard | PASS | Role check + sidebar nav filtering |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-037 | **MEDIUM** | "Fehlende Zeiterfassungen" and "Offene Kontrollblatter" stats show "—" (hardcoded placeholder) -- not implemented | P2 |
| BUG-038 | **LOW** | Revenue calculation uses open (non-final) reports rather than finalized revenue -- misleading metric | P2 |
| BUG-039 | **LOW** | All dashboard text hardcoded in German, not using i18n | P2 |
| BUG-040 | **LOW** | Open cash reports list not clickable to the cash report -- only shows info but no link to the actual report | P3 |

### Security Notes
- Server Component with explicit role check before any data fetching. Good.
- All queries scoped by `tenant_id = profile.tenant_id`.
- Parallel Promise.all for performance -- good pattern.

## Deployment
_To be added by /deploy_
