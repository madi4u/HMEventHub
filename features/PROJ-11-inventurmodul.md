# PROJ-11: Inventurmodul

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-3 (Veranstaltungen)
- Requires: PROJ-16 (Produkte/Artikelstamm)

## User Stories
- Als Mitarbeiter möchte ich vor der Veranstaltung den Mitnahmebestand je Artikel erfassen.
- Als Mitarbeiter möchte ich nach der Veranstaltung den Retourenbestand erfassen.
- Als Mitarbeiter muss ich ein Foto vom Ist-Zustand hochladen.
- Als Owner möchte ich den Verbrauch (Mitnahme minus Retoure) automatisch berechnet sehen.
- Als Owner möchte ich Inventurdifferenzen auf einen Blick erkennen.

## Acceptance Criteria
- [ ] Inventur-Erfassung: Session-Typ wählen (INTAKE / RETURN / COUNT)
- [ ] Artikel-Liste aus `products` für diesen Mandanten mit Mengenfeldern
- [ ] Pflicht-Foto pro Session (Upload in `inventory-photos` Bucket)
- [ ] Gespeichert: Wer, Wann, Welche Veranstaltung, Welcher Tag, Welche Mengen
- [ ] Auswertungsansicht (Admin): Tabelle mit INTAKE / RETURN / Verbrauch / Differenz je Artikel
- [ ] Mehrere Inventur-Sessions pro Tag möglich (z.B. Zählung am Morgen + Abend)
- [ ] Mitarbeiter sieht nur Events zu denen sie zugewiesen sind
- [ ] Mehrsprachige UI

## Edge Cases
- Keine Produkte angelegt → Hinweis, Link zu Produktverwaltung
- Menge = 0 eingeben → erlaubt (explizit Null-Bestand dokumentieren)
- Foto-Upload fehlschlägt → Fehlermeldung, Session nicht speichern
- Retourenbestand > Mitnahmebestand → Warnung aber trotzdem speichern

## Technical Requirements
- `event_inventory_sessions` + `event_inventory_items`
- Verbrauch = INTAKE.quantity - RETURN.quantity (berechnet, nicht gespeichert)
- Storage: `inventory-photos` Bucket

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Session type selection (INTAKE/RETURN/COUNT) | PASS | `InventoryForm` component with session type selection |
| 2 | Product list from tenant's products | PASS | Inventory page queries products with `is_active = true` |
| 3 | Photo required per session | PARTIAL | `inventory-photos` bucket configured, but need to verify enforcement in form |
| 4 | Saved: who, when, event, day, quantities | PASS | `event_inventory_sessions` table captures all required fields |
| 5 | Admin analysis view (INTAKE/RETURN/consumption) | PARTIAL | Component exists in `EventInventoryTab` but consumption calculation (INTAKE - RETURN) not verified |
| 6 | Multiple sessions per day | PASS | No unique constraint on day -- allows multiple sessions |
| 7 | Employee sees only assigned events | PASS | RLS `assigned_view_inventory_sessions` + `is_assigned_to_event()` |
| 8 | Multilingual UI | **FAIL** | Hardcoded German text |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-041 | **MEDIUM** | Consumption/difference calculation not visible in UI -- spec requires admin to see INTAKE - RETURN per product | P2 |
| BUG-042 | **LOW** | Hardcoded German labels | P2 |

### Security Notes
- RLS correctly scoped to tenant + event assignment.
- Storage bucket `inventory-photos` has tenant-scoped upload policy.

## Deployment
_To be added by /deploy_
