# PROJ-15: PDF-Export Kassenblatt

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-7 (Kassenblatt)

## User Stories
- Als Owner möchte ich für jeden abgeschlossenen Veranstaltungstag ein PDF-Kassenblatt generieren.
- Als Owner möchte ich das PDF zur Archivierung herunterladen oder ausdrucken.
- Als Owner möchte ich, dass das PDF die Unterschrift und das Foto des Geldbestands enthält.

## Acceptance Criteria
- [ ] PDF-Export-Button im Kassenblatt-Tab (nur für Status SUBMITTED/FINAL)
- [ ] PDF enthält: Firmenname, Veranstaltungsname, Veranstaltungsort, Datum, Tag-Label
- [ ] PDF enthält: Stückelungstabelle mit Zwischensummen
- [ ] PDF enthält: Gesamtsumme
- [ ] PDF enthält: Name des Mitarbeiters, Einreichungszeitpunkt
- [ ] PDF enthält: Unterschrift als Bild
- [ ] PDF enthält: Foto des Geldbestands
- [ ] PDF enthält: optionale Notizen
- [ ] Dateiname: `kassenblatt-[event-slug]-[datum].pdf`
- [ ] Helles, druckfreundliches Layout
- [ ] Nur OWNER/TENANT_ADMIN/EVENT_MANAGER dürfen PDF generieren

## Edge Cases
- Unterschrift oder Foto fehlt (ältere Einträge) → Sektion leer, kein Fehler
- PDF-Generierung für OPEN-Kassenblatt → blockiert (nur SUBMITTED/FINAL)

## Technical Requirements
- API Route `/api/cash-reports/[id]/export-pdf`
- PDF-Pfad in `cash_reports.pdf_file_path` speichern (optional Caching)
- Storage: `event-documents` Bucket für archivierte PDFs

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Export button in cash tab (SUBMITTED/FINAL only) | PASS | Button appears only for `status === 'FINAL'` in `EventCashTab` |
| 2 | PDF: company name, event name, location, date, day label | PASS | HTML template includes header with event and day info |
| 3 | PDF: denomination table with subtotals | PASS | Notes and coins tables rendered separately |
| 4 | PDF: grand total | PASS | Total row with `formatCurrency(report.total_amount)` |
| 5 | PDF: employee name, submission timestamp | PASS | "Erstellt von" and "Eingereicht am" fields |
| 6 | PDF: signature as image | **FAIL** | Only shows text "Unterschrift vorhanden" or "Keine Unterschrift" -- does not render actual signature image |
| 7 | PDF: cash balance photo | **FAIL** | Photo not included in PDF at all |
| 8 | PDF: optional notes | PASS | Notes section rendered when present |
| 9 | Filename format | PARTIAL | Uses `kassenblatt-[id].html` -- should be `kassenblatt-[event-slug]-[datum].pdf` |
| 10 | Print-friendly layout | PASS | White background, clean layout |
| 11 | Role restriction: OWNER/TENANT_ADMIN/EVENT_MANAGER | PASS | Checks `isAdminRole()` -- but this excludes EVENT_MANAGER. Bug. |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-052 | **HIGH** | Generates HTML not PDF, same as PROJ-14 | P1 |
| BUG-053 | **HIGH** | XSS vulnerability: Same as PROJ-14 -- report notes and event title interpolated into HTML without sanitization | P0 |
| BUG-054 | **MEDIUM** | Signature image not rendered -- only text placeholder shown | P1 |
| BUG-055 | **MEDIUM** | Cash photo not included in PDF | P1 |
| BUG-056 | **MEDIUM** | Role check uses `isAdminRole()` which excludes EVENT_MANAGER. Spec says EVENT_MANAGER should have access. Should use `isManagerRole()`. | P1 |
| BUG-057 | **LOW** | Filename does not match spec format | P3 |
| BUG-058 | **MEDIUM** | Export button only appears for FINAL status but spec says SUBMITTED should also work | P2 |

### Security Notes
- Same XSS concern as PROJ-14 -- user-supplied notes injected into raw HTML.
- Role check is stricter than spec requires (excludes EVENT_MANAGER).
- Tenant isolation correctly enforced.

## Deployment
_To be added by /deploy_
