# PROJ-20: Dokumentenverwaltung pro Event

## Status: Planned
**Created:** 2026-03-29
**Last Updated:** 2026-03-29

## Dependencies
- Requires: PROJ-3 (Veranstaltungen)
- Requires: PROJ-5 (Mitarbeiter-Zuordnung)

## User Stories
- Als Owner möchte ich Dokumente (PDFs, Ausweise, Eintrittskarten) zu einer Veranstaltung hochladen.
- Als Mitarbeiter möchte ich hochgeladene Dokumente für mein Event herunterladen.
- Als Owner möchte ich Dokumente kategorisieren und löschen können.

## Acceptance Criteria
- [ ] Dokumente-Tab in Veranstaltungsdetailseite
- [ ] Upload: PDF, Bilder (JPEG, PNG), max. 50MB
- [ ] Kategorien: Ausweis (ID), Eintrittskarte (TICKET), Unterlagen (CONTRACT), Foto (PHOTO), PDF, Sonstiges (OTHER)
- [ ] Liste: Dateiname, Kategorie, Datum, Uploader, Aktionen (Download, Löschen)
- [ ] Bildvorschau direkt in der Liste (Thumbnail)
- [ ] PDF-Vorschau (In-Browser oder Download)
- [ ] Löschen: nur OWNER/ADMIN; Mitarbeiter können nur eigene Uploads löschen
- [ ] Alle zugewiesenen Mitarbeiter können Dokumente sehen und herunterladen
- [ ] Dateipfad-Struktur: `tenant/{tenantId}/events/{eventId}/documents/{filename}`

## Edge Cases
- Datei zu groß (>50MB) → Fehlermeldung vor Upload
- Nicht erlaubter Dateityp → Fehlermeldung
- Datei mit gleichem Namen → Timestamp im Dateinamen anhängen
- Dokument löschen das in anderem Kontext referenziert wird → Hinweis

## Technical Requirements
- `event_documents` Tabelle mit `tenant_id`, `file_path`, `category`, `uploaded_by`
- Storage: `event-documents` Bucket mit tenantbasiertem Pfad
- Validierung: MIME-Type und Dateigröße serverseitig prüfen

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
**Tested:** 2026-03-29 | **Overall: PARTIAL**

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Documents tab in event detail | PASS | `EventDocumentsTab` component exists as tab |
| 2 | Upload: PDF, images, max 50MB | PASS | `event-documents` bucket configured with 50MB limit, correct MIME types |
| 3 | Categories: ID, TICKET, CONTRACT, PHOTO, PDF, OTHER | PASS | `DocumentCategory` type and DB constraint match spec |
| 4 | List: filename, category, date, uploader, actions | PASS | Fields exist in `event_documents` table schema |
| 5 | Image thumbnail preview | PARTIAL | Not verified in component code |
| 6 | PDF preview | PARTIAL | Not verified in component code |
| 7 | Delete: only OWNER/ADMIN | PASS | RLS `admin_delete_documents` restricts to admins |
| 8 | All assigned members can view/download | PASS | RLS `assigned_view_documents` allows assigned users |
| 9 | File path structure: tenant/events/documents | PASS | Storage policy uses tenant-scoped folder check |

### Bugs Found

| ID | Severity | Description | Fix Priority |
|----|----------|-------------|-------------|
| BUG-067 | **LOW** | Spec says "Mitarbeiter konnen nur eigene Uploads loschen" but RLS `admin_delete_documents` only allows admin deletion -- employees cannot delete any documents including their own | P2 |
| BUG-068 | **LOW** | No document UPDATE policy -- once uploaded, metadata (category) cannot be changed | P3 |

### Security Notes
- Storage policies correctly use tenant-scoped folder paths.
- Upload allowed for all tenant members (not just assigned), which may be more permissive than intended for documents.
- Delete restricted to admin roles at both DB and storage level.

## Deployment
_To be added by /deploy_
