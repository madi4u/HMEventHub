# Product Requirements Document — H+M EventHub

## Vision
H+M EventHub ist eine mandantenfähige Web-App für Catering- und Foodtruck-Unternehmen. Sie ersetzt Papier, Excel und Ausdrucke durch eine zentrale digitale Plattform: Veranstaltungen planen, Teams einteilen, Kassenblätter digital abschließen, Stunden erfassen und Mitarbeiter onboarden — alles in einer App, auf dem Smartphone.

## Target Users

### Chef / Owner (Primär)
- Verantwortlich für Veranstaltungsplanung, Team-Einteilung und Abrechnung
- Braucht jederzeit Überblick über laufende Events, Umsätze, offene Kassenblätter
- Aktueller Pain Point: Papier-Kassenblätter, Excel-Stundenlisten, ausgedruckte Infomappen

### Standleiter (Sekundär)
- Leitet ein Event vor Ort, koordiniert das Team
- Braucht schnellen Zugriff auf Veranstaltungsinfos, kann Checklisten und Kassenblatt abschließen

### Mitarbeiter / Employee (Primär-Endnutzer)
- 15+ Mitarbeiter, z.T. geringer Tech-Affinität, mehrsprachig (DE/EN/ES)
- Nutzt App auf dem Smartphone: einstempeln, Inventur erfassen, Kassenblatt ausfüllen, Feed nutzen
- Darf nur eigene zugewiesene Veranstaltungen sehen

### Tenant Admin (Verwaltung)
- Verwaltet Benutzer, Rollen und Stammdaten innerhalb des Mandanten

## Core Features (Roadmap)

| Priorität | Feature | ID | Status |
|-----------|---------|-----|--------|
| P0 (MVP) | Auth & Rollenmodell | PROJ-1 | Planned |
| P0 (MVP) | Mandanten & Benutzerverwaltung | PROJ-2 | Planned |
| P0 (MVP) | Veranstaltungen CRUD | PROJ-3 | Planned |
| P0 (MVP) | Veranstaltungsdetailseite | PROJ-4 | Planned |
| P0 (MVP) | Mitarbeiter-Zuordnung zu Events | PROJ-5 | Planned |
| P0 (MVP) | Meine Veranstaltungen (Mitarbeiter) | PROJ-6 | Planned |
| P0 (MVP) | Kassenblatt (Tages-Kassenblatt digital) | PROJ-7 | Planned |
| P0 (MVP) | Zeiterfassung (Ein-/Ausstempeln) | PROJ-8 | Planned |
| P0 (MVP) | Onboarding-Modul | PROJ-9 | Planned |
| P1 | Master-Dashboard | PROJ-10 | Planned |
| P1 | Inventurmodul | PROJ-11 | Planned |
| P1 | Kontrollblätter / Checklisten | PROJ-12 | Planned |
| P1 | Feed / Dokumentations-Chat | PROJ-13 | Planned |
| P1 | PDF-Export Veranstaltung | PROJ-14 | Planned |
| P1 | PDF-Export Kassenblatt | PROJ-15 | Planned |
| P2 | Produkte / Artikelstamm | PROJ-16 | Planned |
| P2 | Logistik-Stammdaten | PROJ-17 | Planned |
| P2 | Mehrsprachigkeit Mitarbeiterbereich | PROJ-18 | Planned |
| P2 | Superadmin-Bereich | PROJ-19 | Planned |
| P2 | Dokumentenverwaltung pro Event | PROJ-20 | Planned |

## Success Metrics
- **Kein Papier mehr auf Events:** Kassenblatt, Stundenzettel und Checklisten laufen vollständig digital
- **Weniger Abrechnungsfehler:** Automatische Summenberechnung, keine handschriftlichen Fehler
- **Mitarbeiter-Selbstbedienung:** App ohne Schulung nutzbar, auch für Tech-ferne Mitarbeiter
- **Chef-Überblick jederzeit:** Status aller laufenden Events auf dem Handy in <30 Sekunden abrufbar

## Constraints
- Team: 1 Entwickler (KI-gestützt mit Claude Code)
- Deployment: Vercel (Frontend) + Supabase (Backend)
- Geräte: Mobile-first (Smartphone), aber auch Desktop für Chef-Bereich
- Sprachen: Mitarbeiterbereich DE / EN / ES
- Keine externen Kassensystem-Schnittstellen

## Non-Goals (Version 1)
- Keine Kassensystem-Anbindung (Orderbird, SumUp etc.)
- Keine Lohnberechnung aus Zeiterfassungsdaten
- Keine Kundenverwaltung / CRM / Angebotswesen
- Kein vollständiges Warenwirtschaftssystem mit Bestellungen und Lieferanten
- Kein öffentliches Buchungsportal für Veranstalterkunden
