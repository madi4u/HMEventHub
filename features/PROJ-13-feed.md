# PROJ-13: Feed / Dokumentations-Chat

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Mitarbeiter möchte ich Schäden am Fahrzeug oder Equipment mit Foto dokumentieren.
- Als Mitarbeiter möchte ich organisatorische Hinweise im Feed hinterlassen.
- Als Owner möchte ich alle Feed-Einträge eines Events chronologisch sehen.
- Als Owner möchte ich Schaden-Einträge auf einen Blick erkennen (farblich markiert).

## Acceptance Criteria
- [ ] Feed-Ansicht im Event: chronologische Liste aller Einträge (neueste zuerst oder älteste zuerst, konfigurierbar)
- [ ] Neuer Eintrag: Kategorie wählen (DAMAGE, INFO, PHOTO, NOTE), Text, optionales Foto
- [ ] Kategorie-Badge: DAMAGE = rot, INFO = blau, PHOTO = grün, NOTE = grau
- [ ] Foto-Anhang als Thumbnail klickbar/vergrößerbar
- [ ] Einträge zeigen: Avatar, Name, Zeitstempel, Kategorie, Text, Foto
- [ ] Admin kann Einträge löschen
- [ ] Mitarbeiter können nur eigene Einträge im eigenen Event anlegen
- [ ] Mehrsprachige UI (Kategorie-Labels, Buttons, Hinweise)

## Edge Cases
- Kein Text und kein Foto → Validierungsfehler (mind. eines Pflicht)
- Foto-Upload schlägt fehl → Fehlermeldung, Eintrag ohne Foto speichern oder abbrechen
- Sehr viele Einträge → Pagination oder Infinite Scroll
- Feed-Eintrag in Event ohne eigene Zuweisung → RLS blockiert

## Technical Requirements
- `event_feed_entries` + `event_feed_attachments`
- Storage: `event-photos` Bucket für Feed-Fotos
- RLS: `assigned_create_feed_entries` Policy

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Chronological feed list | PASS | `EventFeedTab` and dedicated `/feed` page exist |
| 2 | New entry: category + text + optional photo | PASS | `NewFeedEntryDialog` component with category selection |
| 3 | Category badges (DAMAGE=red, INFO=blue, etc.) | PASS | `FeedEntry` component with category-colored badges |
| 4 | Photo thumbnail clickable | PASS | Attachment display in feed entry component |
| 5 | Entry shows: avatar, name, timestamp, category, text, photo | PASS | `FeedEntry` component renders all fields |
| 6 | Admin can delete entries | PASS | RLS `admins_delete_feed_entries` policy for admin deletion |
| 7 | Employee can only post in own events | PASS | RLS `assigned_create_feed_entries` enforces event assignment |
| 8 | Multilingual UI | PARTIAL | Category labels translated in i18n files but page chrome likely hardcoded |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-045 | **LOW** | No validation that at least text OR photo is provided -- spec says both empty should be rejected | P2 |
| BUG-046 | **LOW** | No pagination/infinite scroll -- could be slow with many entries | P3 |

### Security Notes
- RLS correctly enforces: view only for assigned users or managers, create only for assigned users, delete only for admins.
- Feed attachments follow parent entry access via JOIN-based policy.

## Deployment
_To be added by /deploy_
