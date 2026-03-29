# PROJ-14: PDF-Export Veranstaltung

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-4 (Veranstaltungsdetailseite)
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Owner möchte ich eine Veranstaltung als PDF exportieren, das ich ausdrucken und Mitarbeitern mitgeben kann.
- Als Owner möchte ich, dass das PDF alle relevanten Infos enthält: Ort, Team, Zeiten, Logistik, Hinweise.
- Als Owner möchte ich das PDF direkt aus der Veranstaltungsdetailseite heraus generieren.

## Acceptance Criteria
- [ ] Export-Button in der Veranstaltungsdetailseite (Header-Bereich), sichtbar für OWNER/EVENT_MANAGER+
- [ ] PDF enthält: Veranstaltungsname, Typ, Datum/Zeitraum, Uhrzeiten, Abfahrtszeit, Status
- [ ] PDF enthält: vollständige Adresse, Standnummer, Maps-Links als Text
- [ ] PDF enthält: Ansprechpartner (Veranstalter, Kontaktperson, Telefon, Notfall)
- [ ] PDF enthält: Team-Tabelle (Name, Rolle)
- [ ] PDF enthält: Logistik (Fahrzeug, Foodtruck, Kühlwagen)
- [ ] PDF enthält: Timetable / Ablauf
- [ ] PDF enthält: Interne Hinweise und Anweisungen
- [ ] PDF: H+M EventHub Branding, Datum/Uhrzeit der Generierung, Seitenzahlen
- [ ] PDF: helles, druckfreundliches Layout (kein Dark Mode im PDF)
- [ ] Dateiname: `eventhub-[event-slug]-[datum].pdf`
- [ ] Nur OWNER/TENANT_ADMIN/EVENT_MANAGER/STANDLEITER (optional) dürfen exportieren

## Edge Cases
- Event hat keine Logistik-Zuordnung → Sektion leer oder ausgeblendet
- Event hat kein Team → Team-Sektion leer
- Sehr langer Inhalt → mehrseitiges PDF korrekt
- PDF-Generierung schlägt fehl → Fehlermeldung, kein leeres PDF ausliefern

## Technical Requirements
- API Route `/api/events/[id]/export-pdf`
- Serverseitige PDF-Generierung (kein Client-Side)
- Export-Eintrag in `event_exports` speichern

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Export button in event detail header | PASS | PDF button visible for managers in header |
| 2 | PDF contains: name, type, date, times, status | PASS | HTML template includes all fields |
| 3 | PDF contains: full address, stand number, maps links as text | PASS | Address section with maps links |
| 4 | PDF contains: contact persons | PASS | Organizer, stand contact, emergency phone |
| 5 | PDF contains: team table | PASS | Table with name, role, email, phone |
| 6 | PDF contains: logistics | **FAIL** | No logistics data fetched or rendered in the PDF template |
| 7 | PDF contains: timetable | **FAIL** | No timetable section -- only event days listed |
| 8 | PDF contains: internal notes | PASS | Rendered at bottom of PDF |
| 9 | H+M branding, timestamp, page numbers | PASS | Logo, creation date/time, "Seite 1" footer |
| 10 | Light, print-friendly layout | PASS | White background, clean typography |
| 11 | Filename format | PARTIAL | Uses `eventhub-[slug]-[date].pdf` but outputs `.html` extension |
| 12 | Role restriction | PASS | Server-side check `isManagerRole(profile.role)` returns 403 |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-047 | **HIGH** | Export generates HTML, not actual PDF. Comment in code says "in production, use puppeteer or react-pdf for actual PDF". File is downloaded as `.html`. | P1 |
| BUG-048 | **HIGH** | XSS vulnerability: Event title, internal notes, and contact names are interpolated directly into HTML template string without sanitization. Malicious input like `<script>alert('xss')</script>` in event title would execute in the exported HTML. | P0 |
| BUG-049 | **MEDIUM** | No logistics data in PDF -- spec requires vehicle/foodtruck/cooling trailer | P2 |
| BUG-050 | **MEDIUM** | No timetable/schedule section in PDF | P2 |
| BUG-051 | **MEDIUM** | No export record created in `event_exports` table as spec requires | P2 |

### Security Notes
- **CRITICAL XSS**: User-supplied data inserted into raw HTML without escaping. Any field (title, notes, contacts) can inject HTML/JavaScript.
- API route correctly checks auth and role before generating.
- Tenant isolation enforced via `eq('tenant_id', profile.tenant_id)` on the event query.

## Deployment
_To be added by /deploy_
