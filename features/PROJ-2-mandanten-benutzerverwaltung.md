# PROJ-2: Mandanten & Benutzerverwaltung

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-1 (Auth & Rollenmodell)

## User Stories
- Als Owner möchte ich neue Mitarbeiter per E-Mail einladen, damit sie sich registrieren können.
- Als Owner möchte ich die Rolle eines Mitarbeiters ändern können (z.B. EMPLOYEE → STANDLEITER).
- Als Owner möchte ich Mitarbeiter deaktivieren können, ohne sie zu löschen.
- Als Owner möchte ich alle Benutzer meines Mandanten in einer Übersicht sehen.
- Als Mitarbeiter möchte ich meinen Namen, meine Telefonnummer und meine bevorzugte Sprache im Profil speichern.
- Als Tenant Admin möchte ich alle Profile meines Mandanten verwalten können.

## Acceptance Criteria
- [ ] Benutzerverwaltungs-Seite zeigt alle Profile des eigenen Mandanten (Name, E-Mail, Rolle, Sprache, Status)
- [ ] Owner/Tenant Admin können Rolle eines Users ändern
- [ ] Owner/Tenant Admin können User deaktivieren (`is_active = false`)
- [ ] Deaktivierte User können sich nicht mehr einloggen
- [ ] Profil-Seite: Mitarbeiter kann Namen, Telefon und bevorzugte Sprache (DE/EN/ES) speichern
- [ ] Sprachwahl wird in `profiles.preferred_language` gespeichert und beim nächsten Login geladen
- [ ] Avatar-Upload möglich (Supabase Storage, Bucket: `avatars`)
- [ ] Mandantentrennung: Kein User sieht Profile anderer Mandanten (RLS)

## Edge Cases
- Einladungs-E-Mail kommt nicht an → Resend-Funktion vorsehen
- User ändert E-Mail → Supabase Auth handelt Bestätigung
- Letzter Owner versucht sich selbst zu deaktivieren → blockieren mit Hinweis
- User ohne `tenant_id` → kann nicht auf mandantenspezifische Daten zugreifen

## Technical Requirements
- Supabase Auth für User-Einladung (`inviteUserByEmail`)
- `profiles` Tabelle mit `tenant_id`, `role`, `preferred_language`, `is_active`
- RLS: User sehen nur Profile desselben Mandanten
- Storage: `avatars` Bucket, öffentlich lesbar

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | User management page shows all profiles of own tenant | PASS | `/users` page queries profiles by `tenant_id`, shows name, email, role, status |
| 2 | Owner/Tenant Admin can change user role | PARTIAL | Users page exists but no role change functionality visible in the code; only display of roles, no edit action button found |
| 3 | Owner/Tenant Admin can deactivate users | PARTIAL | `is_active` field displayed but no toggle/deactivate button found in users page |
| 4 | Deactivated users cannot log in | **FAIL** | No `is_active` check in login flow or dashboard layout (see BUG-002 in PROJ-1) |
| 5 | Profile page: name, phone, language editable | PASS | Settings/profile page exists at `/settings/profile` (nav item present) |
| 6 | Language saved in `profiles.preferred_language` | PASS | UserNav `handleLanguageChange` updates DB and local state |
| 7 | Avatar upload possible | PARTIAL | Avatar bucket configured in storage (public, 5MB), `AvatarImage` component uses `avatar_url`, but no upload UI found in settings page |
| 8 | Tenant isolation via RLS | PASS | RLS policy `users_view_same_tenant_profiles` restricts to `tenant_id = my_tenant_id()` |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-005 | **HIGH** | No UI to change user roles -- acceptance criterion requires Owner/Admin can change roles but no edit controls exist on `/users` page | P1 |
| BUG-006 | **HIGH** | No UI to deactivate users -- users page shows status but no activate/deactivate toggle | P1 |
| BUG-007 | **MEDIUM** | No avatar upload UI -- bucket configured but no upload component in profile/settings | P2 |
| BUG-008 | **MEDIUM** | No user invitation flow -- spec requires `inviteUserByEmail` but no invite button/dialog found | P1 |

### Security Notes
- RLS on profiles table correctly restricts cross-tenant access.
- `admins_update_tenant_profiles` policy allows admin role updates at DB level but no UI exposes this.
- Profile INSERT policy (`allow_profile_insert_on_signup`) correctly scoped to `user_id = auth.uid()`.

## Deployment
_To be added by /deploy_
