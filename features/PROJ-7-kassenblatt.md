# PROJ-7: Kassenblatt (Tages-Kassenblatt digital)

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-3 (Veranstaltungen CRUD — Event Days)
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Mitarbeiter möchte ich am Tagesende die Bareinnahmen nach Stückelung erfassen, damit die Abrechnung korrekt ist.
- Als Mitarbeiter möchte ich die Gesamtsumme automatisch berechnet bekommen — kein manuelles Addieren.
- Als Mitarbeiter möchte ich das Kassenblatt mit meiner digitalen Unterschrift abschließen.
- Als Mitarbeiter muss ich ein Foto vom Geldbestand hochladen, bevor ich abschicken kann.
- Als Owner möchte ich für jeden Veranstaltungstag ein eigenes Kassenblatt sehen.
- Als Owner möchte ich abgeschlossene Kassenblätter nicht mehr veränderbar haben.
- Als Owner möchte ich den Tagesumsatz je Veranstaltungstag im Dashboard sehen.

## Acceptance Criteria
- [ ] Pro Event-Tag (`event_days`) existiert maximal 1 Kassenblatt (`UNIQUE(event_day_id)`)
- [ ] Stückelungstabelle: 500€, 200€, 100€, 50€, 20€, 10€, 5€ (Scheine) + 2€, 1€, 0.50€, 0.20€, 0.10€, 0.05€, 0.02€, 0.01€ (Münzen)
- [ ] Jede Zeile: Stückelung | Anzahl (Input) | Zwischensumme (auto berechnet)
- [ ] Gesamtsumme wird live aktualisiert beim Eingeben
- [ ] Unterschriften-Canvas: Touch- und Mauseingabe, "Löschen"-Button
- [ ] Foto-Upload Pflicht vor Absenden (Hinweis: "Bitte fotografiere den vollständigen Geldbestand")
- [ ] Absenden → Bestätigungs-Dialog → Status wird `FINAL`
- [ ] Nach FINAL: alle Felder read-only, kein Bearbeiten/Löschen durch Mitarbeiter
- [ ] Owner/Event Manager können FINAL-Kassenblätter einsehen aber nicht verändern
- [ ] Status-Anzeige: OPEN (offen), SUBMITTED (eingereicht), FINAL (abgeschlossen)
- [ ] Mehrsprachige UI: alle Labels, Hinweise, Buttons in DE/EN/ES
- [ ] Entwurf-Speicherung: Mitarbeiter kann Zwischenstand speichern ohne abzuschicken

## Edge Cases
- Mitarbeiter schickt ab ohne Unterschrift → Validierungsfehler
- Mitarbeiter schickt ab ohne Foto → Validierungsfehler
- Alle Stückelungen = 0 → Gesamtsumme = 0, aber Absenden möglich (0-Tage vorkommen)
- Browser geschlossen während Eingabe → Entwurf bleibt erhalten (Draft-Save)
- Owner versucht FINAL-Kassenblatt zu bearbeiten → read-only, kein Edit-Button

## Technical Requirements
- `cash_reports` + `cash_report_denominations` Tabellen
- Status-Flow: OPEN → SUBMITTED → FINAL (kein Zurück)
- Storage: `cash-report-photos` und `signatures` Buckets
- PDF-Export (PROJ-15): Kassenblatt als druckbares PDF

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Max 1 cash report per event day (UNIQUE) | PASS | `UNIQUE(event_day_id)` constraint in DB schema |
| 2 | Denomination table with all EUR values | PASS | `getDefaultDenominations()` in `denomination-table.tsx` (need to verify exact values) |
| 3 | Each row: denomination, quantity input, subtotal | PASS | DenominationTable component with input fields |
| 4 | Grand total live-updated | PASS | `grandTotal = denominations.reduce((sum, d) => sum + d.subtotal, 0)` |
| 5 | Signature canvas with touch/mouse support | PASS | `SignatureCanvas` component with clear button |
| 6 | Photo upload required before submit | PASS | `handleSubmit` checks `!photo && !report?.cash_photo_file_path` |
| 7 | Submit with confirmation dialog | PASS | `AlertDialog` component with confirmation text |
| 8 | After submit: status = SUBMITTED (not FINAL as spec says) | **FAIL** | Code sets status to `SUBMITTED` on submit, not `FINAL`. Spec says "Absenden -> Status wird FINAL" |
| 9 | After FINAL: read-only | PASS | `isReadOnly = report?.status === 'FINAL'` disables all inputs |
| 10 | Status display: OPEN, SUBMITTED, FINAL | PASS | Badge with status labels and colors |
| 11 | Multilingual UI | **FAIL** | All labels hardcoded in German ("Stückelung", "Hinweise", "Unterschrift", etc.) |
| 12 | Draft save | PASS | "Entwurf speichern" button calls `handleSaveDraft` |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-024 | **HIGH** | Submit sets status to `SUBMITTED` not `FINAL`. The spec says submit should set `FINAL`. There is no mechanism to transition from SUBMITTED to FINAL -- no "Finalize" button for Owner/Admin. This leaves cash reports stuck in SUBMITTED state. | P0 |
| BUG-025 | **HIGH** | Storage bucket mismatch: Code uploads to `cash-reports` bucket but storage config defines `cash-report-photos` and `signatures` buckets. Upload will fail with bucket-not-found error. | P0 |
| BUG-026 | **MEDIUM** | No `submitted_by_user_id` set on submit -- the field is never populated in the update call | P1 |
| BUG-027 | **MEDIUM** | Cash report page has no auth check -- it is a client component with no server-side role verification. Any authenticated user could access any cash report URL. | P1 |
| BUG-028 | **LOW** | All text hardcoded in German, not multilingual | P2 |

### Security Notes
- Cash report RLS policies exist for SELECT/INSERT/UPDATE with event-assignment checks.
- However, the page-level auth check is missing (client component, no server wrapper).
- Storage upload path uses `cash-reports` bucket which does not exist in the migration -- should be `cash-report-photos` and `signatures`.

## Deployment
_To be added by /deploy_
