# PROJ-16: Produkte / Artikelstamm

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-2 (Mandanten)

## User Stories
- Als Owner möchte ich alle Produkte zentral anlegen und verwalten, die bei Veranstaltungen eingesetzt werden.
- Als Owner möchte ich Produktkategorien definieren (z.B. Fleisch, Beilagen, Verpackung).
- Als Owner möchte ich jedem Produkt eine Einheit zuweisen (Stück, kg, Liter).
- Als Mitarbeiter sehe ich bei der Inventurerfassung nur die für diesen Mandanten relevanten Produkte.

## Acceptance Criteria
- [ ] Produktübersicht: Tabelle mit Name, Kategorie, Einheit, Status (aktiv/inaktiv)
- [ ] Produkt anlegen/bearbeiten: Name, Kategorie, Einheit, Notizen, optionales Foto
- [ ] Kategorien verwalten: eigene Sektion oder Modal
- [ ] Produkt deaktivieren (bleibt in historischen Inventuren erhalten)
- [ ] Produktfoto-Upload (JPEG, PNG, WebP)
- [ ] Nur OWNER/TENANT_ADMIN/ADMIN dürfen Produkte verwalten
- [ ] Mitarbeiter sehen Produktliste nur in Inventur-Kontext (nicht als eigene Seite)

## Edge Cases
- Produkt löschen das in Inventureinträgen referenziert wird → nur deaktivieren, nicht löschen
- Kategorie löschen mit zugewiesenen Produkten → blockieren mit Hinweis

## Technical Requirements
- `products` + `product_categories` Tabellen mit `tenant_id`
- `is_active` Flag statt physischem Löschen
- Storage: Produktfotos in `event-photos` Bucket (oder dedizierter Bucket)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Product overview: table with name, category, unit, status | PASS | `/products` page with table showing product fields and `is_active` badge |
| 2 | Create/edit product: name, category, unit, notes, photo | PARTIAL | Product management exists but photo upload not verified |
| 3 | Category management | PARTIAL | Category data structures exist, need to verify CRUD UI |
| 4 | Deactivate product (soft delete) | PASS | `is_active` flag used, products not physically deleted |
| 5 | Product photo upload | PARTIAL | No dedicated product photo bucket; spec says `event-photos` bucket |
| 6 | Only OWNER/TENANT_ADMIN/ADMIN can manage | PASS | RLS `admin_manage_products` policy and sidebar role filtering |
| 7 | Employees see products only in inventory context | PASS | `/products` page hidden from employee nav; products visible only in inventory form |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-059 | **LOW** | Products page sidebar role includes EVENT_MANAGER but spec says only OWNER/TENANT_ADMIN/ADMIN. EVENT_MANAGER can see products page but RLS `admin_manage_products` restricts writes to admins only. Read access is fine. | P3 |
| BUG-060 | **LOW** | Hardcoded German labels | P2 |

### Security Notes
- RLS: `tenant_view_products` for all tenant members (read), `admin_manage_products` for admins (write).
- Product data properly isolated per tenant.

## Deployment
_To be added by /deploy_
