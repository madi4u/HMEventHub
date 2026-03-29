# PROJ-6: Meine Veranstaltungen (Mitarbeiter-Ansicht)

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-1 (Auth)
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Mitarbeiter möchte ich nach dem Login sofort meine zugewiesenen Veranstaltungen sehen.
- Als Mitarbeiter möchte ich auf einen Blick erkennen, welches Event als nächstes stattfindet.
- Als Mitarbeiter möchte ich auf eine Veranstaltung tippen und die wichtigsten Infos sehen (Ort, Zeit, Team).
- Als Mitarbeiter möchte ich nur freigegebene Informationen sehen — keine internen Notizen oder Finanzdaten.
- Als Standleiter möchte ich eine etwas erweiterte Ansicht haben (z.B. vollständiges Team sehen).

## Acceptance Criteria
- [ ] Route `/my-events` zeigt nur Events, für die der eingeloggte User in `event_assignments` steht
- [ ] Kartenansicht mit: Veranstaltungsname, Datum, Ort, Status-Badge
- [ ] Kommendes nächstes Event visuell hervorgehoben (z.B. "Nächstes Event"-Badge)
- [ ] Vergangene Events sichtbar aber reduziert dargestellt
- [ ] Klick auf Karte → `/my-events/[id]` mit eingeschränkter Detailansicht
- [ ] Eingeschränkte Detailansicht: Übersicht, Zeiterfassung, Feed (je nach Freigabe)
- [ ] `internal_notes` NICHT angezeigt
- [ ] Finanzdaten (Kassenblatt-Summen) NICHT angezeigt außer für eigenes Kassenblatt
- [ ] Mehrsprachige UI (DE/EN/ES gemäß `preferred_language`)
- [ ] Mobile-optimiert: große Touch-Targets, lesbare Schriften

## Edge Cases
- Mitarbeiter hat noch keine zugewiesenen Events → leerer Zustand mit erklärendem Text
- Veranstaltung wird während der Ansicht dem Mitarbeiter entzogen → beim nächsten Laden nicht mehr sichtbar
- Event hat keinen Ort → Ort-Feld ausblenden

## Technical Requirements
- Query filtert Events über JOIN auf `event_assignments` mit `user_id = my_profile_id()`
- Feldbasierte Filterung: `internal_notes` und Finanzdaten serverseitig entfernen
- i18n: alle UI-Texte über Translation Layer

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | `/my-events` shows only assigned events | PASS | Queries `event_assignments` by `user_id = profile.id`, then fetches matching events |
| 2 | Card view with name, date, location, status | PASS | Card with title, date range, start time, city, status badge |
| 3 | Next event highlighted | PARTIAL | Upcoming events section exists with `highlighted` prop adding border color, but no explicit "Nächstes Event" badge on the very next one |
| 4 | Past events reduced display | PASS | Separate "Vergangene Veranstaltungen" section |
| 5 | Click to `/my-events/[id]` | PASS | `Link href={/my-events/${event.id}}` |
| 6 | Restricted detail view | PASS | `/my-events/[id]` shows only Overview, Inventur, Checklisten, Kassenblatt, Feed tabs (no Team, Logistics, Documents, Time Tracking tabs) |
| 7 | `internal_notes` NOT shown | PASS | Explicitly set to `null`: `{ ...event, internal_notes: null }` |
| 8 | Financial data not shown | PASS | `isManager={false}` hides total revenue card in cash tab |
| 9 | Multilingual UI | PARTIAL | Section headers are hardcoded German ("Bevorstehende Veranstaltungen", "Vergangene Veranstaltungen"). Not using `t()`. |
| 10 | Mobile optimized | PASS | Responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-021 | **MEDIUM** | My-events page and detail page have hardcoded German text, not using i18n `t()` function | P2 |
| BUG-022 | **LOW** | No explicit "Nächstes Event" badge -- just border highlight on all upcoming events, not distinguishing the very next one | P3 |
| BUG-023 | **MEDIUM** | Time tracking tab missing from my-events detail page -- employees need to access time tracking from their event view but it is not available as a tab | P1 |

### Security Notes
- `/my-events/[id]` correctly verifies assignment before showing event data.
- `internal_notes` properly stripped server-side before rendering.
- However, the full event object including `internal_notes` is fetched from DB first -- RLS returns it since employee is assigned. The null-setting happens in code, which is correct but relies on developer discipline.

## Deployment
_To be added by /deploy_
