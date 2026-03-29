# PROJ-18: Mehrsprachigkeit Mitarbeiterbereich (DE/EN/ES)

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-1 (Auth — preferred_language)
- Requires: PROJ-6 (Meine Veranstaltungen)

## User Stories
- Als spanischsprachiger Mitarbeiter möchte ich die gesamte App auf Spanisch bedienen können.
- Als Mitarbeiter möchte ich meine Sprache im Profil auswählen und dauerhaft speichern.
- Als Mitarbeiter möchte ich die Sprache auch direkt im Header schnell umschalten können.

## Acceptance Criteria
- [ ] Sprachen: Deutsch (de), Englisch (en), Spanisch (es)
- [ ] Sprachwahl im Benutzerprofil (`profiles.preferred_language`) gespeichert
- [ ] Sprache wird beim Login geladen und bleibt persistent
- [ ] Sprachwahl auch im UserNav / Header-Dropdown direkt umschaltbar
- [ ] Alle Mitarbeiter-Seiten übersetzt: Login, Meine Events, Zeiterfassung, Inventur, Checklisten, Kassenblatt, Feed, Onboarding
- [ ] Navigation, Buttons, Formulare, Fehlermeldungen, Validierungshinweise übersetzt
- [ ] Status-Labels übersetzt (OPEN → Offen / Open / Abierto)
- [ ] Fallback auf DE wenn Übersetzung fehlt
- [ ] Admin-Bereich kann auf DE bleiben (technisch erweiterbar)

## Edge Cases
- Neue Übersetzungs-Keys hinzugefügt aber noch nicht in allen Sprachen → Fallback auf DE zeigt Key-Endung
- User wechselt Sprache → sofortige UI-Aktualisierung ohne Reload
- Browser-Sprache ≠ gewählte Sprache → `preferred_language` hat Vorrang

## Technical Requirements
- i18n Context Provider mit `useTranslation()` Hook
- Übersetzungsdateien: `src/i18n/translations/de.ts`, `en.ts`, `es.ts`
- `profiles.preferred_language` CHECK('de','en','es')
- localStorage als Fallback-Persistenz (für schnelles Laden vor DB-Anfrage)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Languages: DE, EN, ES | PASS | All three translation files complete with matching key structures |
| 2 | Language saved in profiles.preferred_language | PASS | DB field with CHECK constraint |
| 3 | Language loaded on login and persistent | PASS | `I18nProvider` initialized with `profile.preferred_language` in dashboard layout |
| 4 | Language switchable in UserNav/header | PASS | Globe icon dropdown with DE/EN/ES in UserNav, updates DB on change |
| 5 | All employee pages translated | **FAIL** | Translation files exist and are complete, but most pages use hardcoded German strings instead of `t()` calls. Only login, reset-password, and sidebar nav use translations. Dashboard, events, time-tracking, inventory, cash-reports, etc. all have hardcoded German. |
| 6 | Navigation, buttons, forms translated | PARTIAL | Nav items use `t()`. Most buttons and form labels are hardcoded German. |
| 7 | Status labels translated | PASS | `status` section in all 3 translation files covers all statuses |
| 8 | Fallback to DE | PASS | `getNestedValue` returns undefined for missing keys, then falls back to key name (not ideal but functional) |
| 9 | Admin area can stay DE | PASS | Admin pages are all German already |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-062 | **CRITICAL** | Most pages do NOT use the i18n system. Translation files are comprehensive but pages hardcode German strings. Affected pages: dashboard, events list, event detail, event creation form, my-events, time-tracking, cash-report, inventory, checklists, users, products, logistics, superadmin. The i18n infrastructure works but is not wired up to 90%+ of the UI. | P0 |
| BUG-063 | **MEDIUM** | Zod validation messages hardcoded in German across all forms (login, event creation) | P1 |
| BUG-064 | **LOW** | Language switch is instant in UI (good) but fallback behavior when key is missing returns the last segment of the dot-notation key, not the German text | P2 |

### Security Notes
- Language preference stored in DB, loaded server-side -- no client-side manipulation risk.
- Translation files use `as const` for type safety.

## Deployment
_To be added by /deploy_
