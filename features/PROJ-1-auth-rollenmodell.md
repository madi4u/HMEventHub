# PROJ-1: Auth & Rollenmodell

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- None

## User Stories
- Als Mitarbeiter möchte ich mich mit E-Mail und Passwort einloggen, damit ich meine zugewiesenen Veranstaltungen sehen kann.
- Als Owner möchte ich nach dem Login automatisch ins Dashboard weitergeleitet werden, nicht in die Mitarbeiteransicht.
- Als Mitarbeiter möchte ich nach dem Login zu "Meine Veranstaltungen" weitergeleitet werden.
- Als User möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe.
- Als Owner möchte ich, dass nicht autorisierte Nutzer keinen Zugriff auf geschützte Seiten haben.

## Acceptance Criteria
- [ ] Login-Seite zeigt E-Mail + Passwort Formular im Dark Mode
- [ ] Falsche Zugangsdaten zeigen eine verständliche Fehlermeldung
- [ ] Nach Login: OWNER/TENANT_ADMIN/EVENT_MANAGER → `/dashboard`
- [ ] Nach Login: EMPLOYEE/STANDLEITER → `/my-events`
- [ ] Nicht eingeloggte User werden von geschützten Routen zu `/login` redirectet
- [ ] Logout funktioniert und leert die Session
- [ ] Passwort-Reset-Seite vorhanden und funktionsfähig
- [ ] Login-Seite ist mehrsprachig (DE/EN/ES)
- [ ] Session bleibt nach Browser-Neustart erhalten (Supabase Auth Persistence)

## Edge Cases
- User existiert in Auth aber hat kein Profil → Fehlermeldung, kein Crash
- User ist deaktiviert (`is_active = false`) → Zugang verweigern
- Gleichzeitiger Login auf mehreren Geräten → erlaubt (Supabase Standard)
- Abgelaufene Session → automatisch zu Login redirecten
- Rate Limiting bei zu vielen Fehlversuchen → Supabase Auth handelt das

## Technical Requirements
- Supabase Auth (E-Mail + Passwort)
- Rollenbasierter Redirect nach Login (aus `profiles.role`)
- Next.js Proxy (Middleware) schützt alle nicht-öffentlichen Routen
- RLS auf allen Tabellen als zweite Sicherheitsebene

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Login-Seite zeigt E-Mail + Passwort Formular im Dark Mode | PASS | Card with email/password, uses Tailwind dark mode classes via `bg-card` / `border-border` |
| 2 | Falsche Zugangsdaten zeigen Fehlermeldung | PASS | `toast.error(t('errors.loginFailed'))` on Supabase error |
| 3 | OWNER/TENANT_ADMIN/EVENT_MANAGER -> /dashboard | PASS | Login page checks profile.role, non-employee roles go to redirectTo which defaults to `/dashboard` |
| 4 | EMPLOYEE/STANDLEITER -> /my-events | PASS | `employeeRoles = ['EMPLOYEE', 'STANDLEITER', 'READ_ONLY']` routes to `/my-events` |
| 5 | Unauthenticated users redirected to /login | **FAIL** | **CRITICAL**: `src/proxy.ts` defines middleware but NO `middleware.ts` exists at project root. The proxy function is never invoked by Next.js. Protection relies solely on server-side checks in dashboard layout and individual pages. Direct API route access to non-auth-checked endpoints is possible. |
| 6 | Logout works and clears session | PASS | `supabase.auth.signOut()` in UserNav component, redirects to `/login` |
| 7 | Password reset page present and functional | PASS | `/reset-password` page with `resetPasswordForEmail` call. Redirect URL points to `/update-password` which does NOT exist as a page. |
| 8 | Login page is multilingual (DE/EN/ES) | PARTIAL | Uses `useTranslation()` hook for labels, but Zod validation messages are hardcoded in German (`'Ungultige E-Mail-Adresse'`, `'Mindestens 6 Zeichen'`). |
| 9 | Session persists after browser restart | PASS | Supabase Auth default behavior with cookie-based sessions |

### Bugs Found

| ID | Severity | Description | Steps to Reproduce | Fix Priority |
|----|----------|-------------|-------------------|-------------|
| BUG-001 | **CRITICAL** | Middleware not active - `src/proxy.ts` is never loaded. No `middleware.ts` at project root means Next.js middleware never runs. All route protection depends on per-page server-side checks. | Check project root for `middleware.ts` -- it does not exist. The file at `src/proxy.ts` exports a `proxy` function but nothing imports it. | P0 - Immediate |
| BUG-002 | **HIGH** | Deactivated users (`is_active = false`) can still log in. No check for `is_active` flag during or after login flow. | Set `is_active = false` on a profile, attempt login -- will succeed. | P0 |
| BUG-003 | **MEDIUM** | Password reset redirects to `/update-password` but this page does not exist in the app router (`src/app/(auth)/`). Users clicking the reset link will get a 404. | Trigger password reset, click email link. | P1 |
| BUG-004 | **LOW** | Zod validation messages on login form are hardcoded in German, not using i18n. | Switch to EN/ES, trigger validation errors on login. | P2 |

### Security Notes
- Dashboard layout (`(dashboard)/layout.tsx`) does check auth server-side and redirects to `/login` if no user. This is the actual protection layer since middleware is missing.
- Individual pages (events, dashboard, superadmin) also check auth and role. Good defense-in-depth.
- However, static assets and any future unprotected API routes would be exposed without middleware.

## Deployment
_To be added by /deploy_
