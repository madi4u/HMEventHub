# PROJ-4: Veranstaltungsdetailseite

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-3 (Veranstaltungen CRUD)
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Owner möchte ich alle Informationen zu einer Veranstaltung auf einer Seite sehen, gegliedert in Tabs.
- Als Owner möchte ich die Adresse direkt mit Google Maps oder Apple Karten öffnen können.
- Als Standleiter möchte ich die Veranstaltungsinfos (Ort, Zeiten, Ansprechpartner) auf meinem Handy sehen.
- Als Owner möchte ich interne Hinweise und Bemerkungen hinterlegen, die nur berechtigte Rollen sehen.
- Als Owner möchte ich einen Timetable (Aufbau, Start, Ende, Abbau) für das Event pflegen.

## Acceptance Criteria
- [ ] Detailseite erreichbar über `/events/[id]`
- [ ] Header: Veranstaltungsname, Status-Badge, Datum, Aktions-Buttons (Bearbeiten, PDF)
- [ ] Tab: Übersicht (Grunddaten, Ort mit Maps-Links, Ansprechpartner, Timetable, Hinweise)
- [ ] Tab: Team (zugewiesene Mitarbeiter — PROJ-5)
- [ ] Tab: Logistik (Fahrzeug, Foodtruck, Kühlwagen, Equipment — PROJ-17)
- [ ] Tab: Dokumente (Upload, Vorschau, Download — PROJ-20)
- [ ] Tab: Zeiterfassung (Stempel-Übersicht — PROJ-8)
- [ ] Tab: Inventur (Inventur-Sessions — PROJ-11)
- [ ] Tab: Kontrollblätter (Checklisten — PROJ-12)
- [ ] Tab: Kassenblatt (Tages-Kassenblätter — PROJ-7)
- [ ] Tab: Feed (Einträge — PROJ-13)
- [ ] Google Maps Link: `https://maps.google.com/?q=Adresse`
- [ ] Apple Karten Link: `https://maps.apple.com/?q=Adresse`
- [ ] Interne Hinweise (`internal_notes`) nur für OWNER/TENANT_ADMIN/EVENT_MANAGER sichtbar
- [ ] Mitarbeiter sehen eingeschränkte Ansicht (kein internal_notes, keine Finanzdaten)

## Edge Cases
- Event ohne Adresse → Maps-Links ausblenden
- Event ohne Team → leerer Zustand mit Hinweis
- User mit EMPLOYEE-Rolle ruft `/events/[id]` direkt auf → Redirect zu `/my-events/[id]`
- Sehr langer Veranstaltungsname → Truncation im Header

## Technical Requirements
- Tab-State in URL-Parameter (`?tab=team`) für Deep-Linking
- Server Component lädt Event-Daten, Client Components für interaktive Tabs
- Feldbasierte Zugriffskontrolle: `internal_notes` serverseitig nicht ausliefern an EMPLOYEE

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Detail page at `/events/[id]` | PASS | Page exists, loads event data |
| 2 | Header: name, status badge, date, action buttons | PASS | Title, Badge, date range, PDF + Edit buttons for managers |
| 3 | Tab: Overview | PASS | `EventOverviewTab` shows general info, address with maps links, contacts, internal notes |
| 4 | Tab: Team | PASS | `EventTeamTab` shows assigned staff with add/remove |
| 5 | Tab: Logistics | PASS | `EventLogisticsTab` component exists |
| 6 | Tab: Documents | PASS | `EventDocumentsTab` component exists |
| 7 | Tab: Time Tracking | PASS | `EventTimeTrackingTab` component exists |
| 8 | Tab: Inventory | PASS | `EventInventoryTab` component exists |
| 9 | Tab: Checklists | PASS | `EventChecklistsTab` component exists |
| 10 | Tab: Cash Report | PASS | `EventCashTab` component exists |
| 11 | Tab: Feed | PASS | `EventFeedTab` component exists |
| 12 | Google Maps link | PASS | Renders `google_maps_url` as external link in overview |
| 13 | Apple Maps link | PASS | Renders `apple_maps_url` as external link in overview |
| 14 | Internal notes only for managers | PASS | `EventOverviewTab` checks `isManager && event.internal_notes` before rendering |
| 15 | Employee sees restricted view | PARTIAL | Employee is redirected to `/my-events/[id]` which strips `internal_notes` by setting it to `null`. However, employee can still access `/events/[id]` directly as there is no server-side role redirect on the event detail page itself. |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-015 | **HIGH** | No server-side redirect for EMPLOYEE accessing `/events/[id]` -- the page checks `isManagerRole` only for showing edit buttons but does not redirect employees. They can see the full event detail with all tabs (except internal_notes which is hidden by UI only). RLS may block the query but if RLS returns data (employee is assigned), they see the full manager view. | P1 |
| BUG-016 | **MEDIUM** | Tab state not persisted in URL params (`?tab=team`). Uses `defaultValue="overview"` on Tabs component. Deep-linking to specific tabs not possible. | P2 |
| BUG-017 | **LOW** | Tab labels are hardcoded in German, not using i18n | P2 |
| BUG-018 | **MEDIUM** | `internal_notes` field is fetched from DB via `select('*')` even for EMPLOYEE users. While UI hides it, the data is present in the server response. On `/events/[id]`, employee could potentially access internal_notes via browser dev tools since it is in the server-rendered HTML. | P1 |

### Security Notes
- The `/my-events/[id]` page correctly nullifies `internal_notes` before passing to component: `{ ...event, internal_notes: null }`.
- However, `/events/[id]` does NOT do this -- it passes full event data including `internal_notes` to the overview tab even for non-managers (the tab component hides it client-side but data is in the DOM).
- No tenant_id check on the event detail page query -- relies entirely on RLS.

## Deployment
_To be added by /deploy_
