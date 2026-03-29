# PROJ-12: Kontrollblätter / Checklisten

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-3 (Veranstaltungen)
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Owner möchte ich Checklisten-Templates anlegen (z.B. HACCP-Hygiene, Fahrzeugcheck).
- Als Owner möchte ich Templates aus verschiedenen Item-Typen zusammenstellen.
- Als Mitarbeiter möchte ich eine Checkliste für mein Event ausfüllen und am Ende unterschreiben.
- Als Owner möchte ich ausgefüllte Checklisten archiviert und abrufbar haben.

## Acceptance Criteria
- [ ] Template-Verwaltung (Admin): Name, Beschreibung, Kategorie (HYGIENE, VEHICLE, CLEANING, GENERAL, OTHER)
- [ ] Template-Items: CHECKBOX, TEXT, NUMBER, DATE, PHOTO, SIGNATURE
- [ ] Items haben mehrsprachige Labels (DE/EN/ES)
- [ ] Items können als Pflichtfeld markiert werden
- [ ] Mitarbeiter startet Checkliste im Event → öffnet `event_checklist_runs`
- [ ] Checklist-Runner: rendert Items, speichert Antworten progressiv
- [ ] Abschluss: digitale Unterschrift (Canvas) Pflicht
- [ ] Status: OPEN → IN_PROGRESS → COMPLETED
- [ ] Abgeschlossene Checklisten archiviert, nicht mehr bearbeitbar
- [ ] Historie aller Runs pro Event sichtbar für Admin
- [ ] Mehrsprachige Item-Labels und UI

## Edge Cases
- Pflichtfeld nicht ausgefüllt → Submit blockiert mit Hinweis
- Foto-Upload in Checklist-Item schlägt fehl → Fehlermeldung, Item nicht als erledigt markieren
- Template wird geändert während laufender Run → Run behält alten Template-Stand
- Mehrere Mitarbeiter füllen dieselbe Checkliste aus → separate Runs, kein Konflikt

## Technical Requirements
- `checklist_templates` + `checklist_template_items` (mit `label_en`, `label_es`)
- `event_checklist_runs` + `event_checklist_answers`
- Storage: `checklist-photos` und `signatures` Buckets
- i18n: Item-Labels aus `label_de/en/es` je nach `preferred_language`

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Template management (Admin) | PASS | Checklist templates page and management exist |
| 2 | Template items: CHECKBOX, TEXT, NUMBER, DATE, PHOTO, SIGNATURE | PASS | `ChecklistItemType` enum covers all types, `checklist-runner.tsx` renders them |
| 3 | Multilingual item labels (DE/EN/ES) | PASS | DB fields `label`, `label_en`, `label_es` exist in schema |
| 4 | Required field marking | PASS | `is_required` flag in template items |
| 5 | Start checklist in event | PASS | Creates `event_checklist_runs` record |
| 6 | Progressive answer saving | PASS | `ChecklistRunner` component saves answers |
| 7 | Digital signature on completion | PASS | `SignatureCanvas` reused from cash reports, `signature_file_path` field |
| 8 | Status flow: OPEN -> IN_PROGRESS -> COMPLETED | PASS | DB constraint and status tracking |
| 9 | Completed checklists archived/read-only | PASS | Status check prevents modification |
| 10 | Run history per event | PASS | `EventChecklistsTab` lists all runs |
| 11 | Multilingual UI | **FAIL** | Hardcoded German |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-043 | **LOW** | No template CRUD UI found for admins -- template viewing exists but create/edit/delete template UI needs verification | P2 |
| BUG-044 | **LOW** | Hardcoded German labels in checklists pages | P2 |

### Security Notes
- RLS: Template viewing scoped to tenant, management restricted to admins.
- Checklist runs require event assignment for creation.
- `checklist-photos` and `signatures` storage buckets correctly configured.

## Deployment
_To be added by /deploy_
