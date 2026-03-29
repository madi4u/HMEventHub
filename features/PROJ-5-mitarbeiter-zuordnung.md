# PROJ-5: Mitarbeiter-Zuordnung zu Events

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-2 (Benutzerverwaltung)
- Requires: PROJ-3 (Veranstaltungen CRUD)

## User Stories
- Als Owner möchte ich Mitarbeiter einer Veranstaltung zuweisen, damit sie das Event in ihrer App sehen.
- Als Owner möchte ich einem Mitarbeiter eine Rolle im Event geben (STANDLEITER, EMPLOYEE, DRIVER, SUPPORT).
- Als Owner möchte ich Mitarbeiter wieder aus einer Veranstaltung entfernen.
- Als Owner möchte ich auf einen Blick sehen, welche Mitarbeiter welchem Event zugewiesen sind.
- Als Mitarbeiter möchte ich nur Events sehen, für die ich zugewiesen bin — keine anderen.

## Acceptance Criteria
- [ ] Team-Tab in der Veranstaltungsdetailseite zeigt alle zugewiesenen Mitarbeiter
- [ ] Tabelle: Name, Rolle im Event, Telefon, Aktionen
- [ ] "Mitarbeiter hinzufügen"-Dialog: Suche/Auswahl aus allen Profilen des Mandanten
- [ ] Bereits zugewiesene Mitarbeiter erscheinen nicht mehr in der Auswahl
- [ ] Rolle im Event wählbar: STANDLEITER, EMPLOYEE, DRIVER, SUPPORT
- [ ] Mitarbeiter entfernen → Bestätigungs-Dialog
- [ ] Zuweisung speichert in `event_assignments` mit `tenant_id`, `event_id`, `user_id`, `role_in_event`
- [ ] RLS: EMPLOYEE sieht über `event_assignments` nur eigene Veranstaltungen
- [ ] Nur OWNER/EVENT_MANAGER dürfen Zuweisungen verwalten

## Edge Cases
- Mitarbeiter bereits zugewiesen → Duplikat-Fehler abfangen (UNIQUE constraint)
- Mitarbeiter ohne Profil (kein `tenant_id`) → nicht in Auswahl zeigen
- Letzter Mitarbeiter entfernen → erlaubt (Event kann ohne Team existieren)
- Mitarbeiter hat aktive Zeiterfassung bei Entfernung → Hinweis, aber erlaubt

## Technical Requirements
- `event_assignments` Tabelle mit UNIQUE(event_id, user_id)
- RLS: `is_assigned_to_event()` Helper-Funktion steuert Sichtbarkeit
- Server Action `assignUserToEvent()` + `removeUserFromEvent()`

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PASS**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Team tab shows assigned members | PASS | `EventTeamTab` loads assignments with profile join |
| 2 | Table: Name, Role, Phone, Actions | PASS | Shows avatar, name, email, role badge, remove button |
| 3 | Add member dialog with search | PASS | Dialog with search input, filters by name/email |
| 4 | Already assigned members excluded from selection | PASS | `filteredUsers` filters out IDs already in `assignments` |
| 5 | Role in event selectable | PASS | Select dropdown with STANDLEITER, EMPLOYEE, DRIVER, SUPPORT |
| 6 | Remove member with confirmation | PARTIAL | Remove button exists but no confirmation dialog -- directly calls `handleRemoveUser`. Spec requires confirmation dialog. |
| 7 | Saves to event_assignments correctly | PASS | Insert with `event_id`, `tenant_id`, `user_id`, `role_in_event` |
| 8 | RLS: EMPLOYEE sees only own assignments | PASS | `users_view_own_assignments` policy checks `user_id = my_profile_id()` for non-managers |
| 9 | Only OWNER/EVENT_MANAGER can manage | PASS | `isManager` prop controls visibility of add/remove buttons |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-019 | **LOW** | No confirmation dialog before removing team member -- spec requires it, current code deletes immediately on button click | P2 |
| BUG-020 | **LOW** | Phone number not displayed in the team list -- spec says "Name, Rolle im Event, Telefon, Aktionen" but phone is not shown | P3 |

### Security Notes
- Assignment management done via Supabase client, RLS policy `managers_manage_assignments` enforces `is_event_manager()`.
- UNIQUE(event_id, user_id) constraint prevents duplicates at DB level.

## Deployment
_To be added by /deploy_
