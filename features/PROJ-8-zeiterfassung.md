# PROJ-8: Zeiterfassung (Ein-/Ausstempeln)

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Mitarbeiter möchte ich mich mit einem Knopfdruck zu einem Event einstempeln.
- Als Mitarbeiter möchte ich mich ausstempeln, wenn meine Schicht endet.
- Als Mitarbeiter möchte ich eine Pause starten und beenden können.
- Als Owner möchte ich die Arbeitsstunden aller Mitarbeiter pro Veranstaltung in einer Übersicht sehen.
- Als Owner möchte ich Zeiteinträge genehmigen können.
- Als Mitarbeiter möchte ich meine eigene Zeiterfassungshistorie einsehen.

## Acceptance Criteria
- [ ] Stempeluhr-Widget zeigt: Event-Auswahl (nur zugewiesene Events), Status (IDLE / CLOCKED_IN / ON_BREAK), laufende Zeit
- [ ] Einstempeln: Zeitstempel + optional Geolocation speichern
- [ ] Ausstempeln: Zeitstempel + optional Geolocation + automatische Dauer-Berechnung
- [ ] Pause starten/beenden: `break_minutes` wird akkumuliert
- [ ] Mitarbeiter kann nur 1 aktiven Eintrag gleichzeitig haben
- [ ] Laufende Uhr (real-time Counter) während eingestempelt
- [ ] Eigene Zeiterfassungshistorie: Tabelle mit Datum, Einstempel, Ausstempel, Pause, Dauer
- [ ] Admin-Ansicht (Zeiterfassung-Tab im Event): alle Mitarbeiter mit Stunden, Status
- [ ] Genehmigen-Button für OWNER/EVENT_MANAGER: Status → APPROVED
- [ ] Mehrsprachige UI

## Edge Cases
- Mitarbeiter stempelt ein ohne Event auszuwählen → Validierungsfehler
- Mitarbeiter vergisst auszustempeln (z.B. Akku leer) → Owner kann manuell korrigieren
- Geolocation verweigert → Stempeln trotzdem möglich, Koordinaten leer
- Doppeltes Einstempeln verhindert → prüfen ob aktiver Eintrag vorhanden
- Event endet, Mitarbeiter noch eingestempelt → Hinweis im Dashboard (fehlende Zeiterfassung)

## Technical Requirements
- `time_entries` Tabelle: `clock_in`, `clock_out`, `break_minutes`, `status`, `location_in`, `location_out`
- Geolocation via Browser API (`navigator.geolocation`)
- Real-time Counter via `useEffect` Interval im Client
- RLS: User sieht/ändert nur eigene Einträge; Manager sieht alle Einträge des Mandanten

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Clock widget: event selection, status, timer | PASS | `ClockWidget` with Select for events, status badge (IDLE/CLOCKED_IN/ON_BREAK), timer display |
| 2 | Clock in with timestamp + geolocation | PASS | `handleClockIn` gets location via `navigator.geolocation`, stores in `location_in` |
| 3 | Clock out with timestamp + geolocation + duration | PASS | `handleClockOut` stores `clock_out`, `location_out`, status = COMPLETED |
| 4 | Break start/end: break_minutes accumulated | PARTIAL | Break toggle exists but `break_start` is stored only in client state, not persisted to DB. If user refreshes during break, break time is lost. |
| 5 | Only 1 active entry at a time | PARTIAL | Checks for existing ACTIVE entry on load, but no server-side constraint preventing multiple inserts in a race condition |
| 6 | Live timer while clocked in | PASS | `useEffect` with `setInterval` every 30 seconds (could be more frequent for better UX) |
| 7 | Own time history table | PASS | Table with event, clock-in, clock-out, break, duration, status |
| 8 | Admin view in event tab | PASS | `EventTimeTrackingTab` component exists for admin |
| 9 | Approve button for OWNER/EVENT_MANAGER | PARTIAL | Status APPROVED exists in types but no approve button found in the time tracking tab or page |
| 10 | Multilingual UI | **FAIL** | Time tracking page uses hardcoded German text |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-029 | **HIGH** | Break state not persisted to DB -- `break_start` only in React state. Browser refresh during break loses break tracking. | P1 |
| BUG-030 | **MEDIUM** | No approve functionality in UI -- no button for managers to change time entry status to APPROVED | P1 |
| BUG-031 | **LOW** | Timer updates every 30 seconds instead of every second, making it appear to "freeze" | P3 |
| BUG-032 | **LOW** | No manual correction UI for managers (spec: "Owner kann manuell korrigieren") | P2 |
| BUG-033 | **LOW** | Hardcoded German labels, not using i18n | P2 |

### Security Notes
- RLS policy `users_manage_own_time_entries` allows users to manage own entries or event managers to manage all.
- No server-side validation that user is assigned to the event before creating time entry -- relies on RLS.
- Geolocation is optional (gracefully handles denial), which is correct per spec.

## Deployment
_To be added by /deploy_
