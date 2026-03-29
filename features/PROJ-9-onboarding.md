# PROJ-9: Onboarding-Modul

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-1 (Auth)
- Requires: PROJ-2 (Benutzerverwaltung — Sprache)

## User Stories
- Als Mitarbeiter möchte ich Arbeitsanweisungen und Rezepturen in meiner Sprache lesen können.
- Als Mitarbeiter möchte ich Produktpässe mit Fotos und Rezepturen einsehen.
- Als Owner möchte ich Onboarding-Module anlegen und in Deutsch, Englisch und Spanisch befüllen.
- Als Owner möchte ich die Reihenfolge der Module festlegen.
- Als Owner möchte ich Bilder und Videos zu einem Modul hochladen.

## Acceptance Criteria
- [ ] Onboarding-Übersicht zeigt alle aktiven Module in der Sprache des eingeloggten Users
- [ ] Modul-Detailseite: Titel + Inhalt in `preferred_language` des Users (Fallback: DE)
- [ ] Bilder und Videos (aus Storage) werden in der Detailseite angezeigt
- [ ] Admin-Bereich: Module anlegen mit Titel und Inhalt in DE, EN, ES (separate Felder)
- [ ] Drag-or-Nummer-basierte Sortierung der Module
- [ ] Module aktivieren/deaktivieren
- [ ] Produktpass-Sektion: Produkt mit Rezeptur, Zutaten, Foto in DE/EN/ES
- [ ] Upload: Bilder (JPEG, PNG, WebP), Videos (MP4, WebM), PDFs
- [ ] Alle Texte für Mitarbeiter mehrsprachig (DE/EN/ES)

## Edge Cases
- Modul hat keinen Inhalt in der gewählten Sprache → Fallback auf DE mit Hinweis
- Kein aktives Modul vorhanden → Hinweis für Mitarbeiter
- Sehr großes Video-Upload → Maximalgröße 100MB, Fehlermeldung bei Überschreitung
- Modul wird deaktiviert während Mitarbeiter es ansieht → kein Fehler, nur nach Reload nicht mehr sichtbar

## Technical Requirements
- `onboarding_modules`: `title_de/en/es`, `content_de/en/es`, `sort_order`, `is_active`
- `onboarding_assets`: `file_path`, `file_type` (IMAGE/VIDEO/PDF), `sort_order`
- `product_passes`: `recipe_de/en/es`, `image_url`
- Storage: `onboarding-assets` Bucket
- Sprache via `profiles.preferred_language` → i18n Content-Selection serverseitig

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Onboarding overview shows active modules in user's language | PASS | `/onboarding` page filters `is_active = true` and renders based on `preferred_language` |
| 2 | Module detail: title + content in preferred language | PASS | `/onboarding/[id]` page exists |
| 3 | Images and videos from storage displayed | PARTIAL | Asset display component exists, but need to verify full media player |
| 4 | Admin: create modules with DE/EN/ES content | PASS | `/onboarding/manage` page with title/content fields for all 3 languages |
| 5 | Sort order for modules | PASS | `sort_order` field used in queries |
| 6 | Activate/deactivate modules | PASS | `is_active` toggle in manage page |
| 7 | Product pass section | PARTIAL | `product_passes` table and type exist but no dedicated UI found |
| 8 | Upload: Images, Videos, PDFs | PASS | `onboarding-assets` bucket configured with correct MIME types and 100MB limit |
| 9 | Multilingual UI | PARTIAL | Content is multilingual but UI chrome is hardcoded German |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-034 | **MEDIUM** | Product passes (Rezepturen) have no dedicated UI -- table and types exist but no page/component to view or manage them | P2 |
| BUG-035 | **LOW** | No language fallback indicator -- spec says "Fallback auf DE mit Hinweis" when content missing in chosen language, but no hint displayed | P3 |
| BUG-036 | **LOW** | UI text hardcoded in German, not using i18n for page chrome | P2 |

### Security Notes
- RLS: `tenant_view_onboarding` allows all tenant members to view; `admin_manage_onboarding` restricts management to admins.
- Storage: `onboarding-assets` bucket has admin-only upload policy, correctly prevents employee uploads.
- File size limit 100MB configured in bucket.

## Deployment
_To be added by /deploy_
