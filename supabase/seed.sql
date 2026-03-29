-- H+M EventHub Seed Data
-- Demo data for development and testing
-- Run AFTER migrations 001, 002, 003

-- =============================================
-- DISABLE RLS FOR SEEDING (re-enable after)
-- =============================================
SET session_replication_role = replica;

-- =============================================
-- TENANT
-- =============================================
INSERT INTO tenants (id, name, slug, status)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'H+M Catering GmbH',
  'hm-catering',
  'ACTIVE'
);

-- =============================================
-- AUTH USERS (created via Supabase Auth API in practice)
-- For seeding purposes we insert directly into auth.users
-- In production, use the Supabase Dashboard or Admin API
-- =============================================

-- NOTE: Passwords are all: EventHub2024!
-- These are bcrypt hashes for testing only
-- In production NEVER seed real passwords this way

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  aud, role, confirmation_token, recovery_token, email_change_token_new,
  email_change
)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@hm-catering.de',
    crypt('EventHub2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maria Hoffmann"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'manager@hm-catering.de',
    crypt('EventHub2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Thomas Müller"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'leiter@hm-catering.de',
    crypt('EventHub2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sandra Koch"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'mitarbeiter1@hm-catering.de',
    crypt('EventHub2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Jonas Weber"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'mitarbeiter2@hm-catering.de',
    crypt('EventHub2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Laura Schmidt"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PROFILES
-- =============================================
-- Note: handle_new_user trigger fires on auth.users INSERT,
-- but since we're using replica mode, we insert profiles manually.

INSERT INTO profiles (id, user_id, tenant_id, full_name, email, role, preferred_language, phone, is_active)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Maria Hoffmann',
    'admin@hm-catering.de',
    'TENANT_ADMIN',
    'de',
    '+49 176 11223344',
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Thomas Müller',
    'manager@hm-catering.de',
    'EVENT_MANAGER',
    'de',
    '+49 176 22334455',
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Sandra Koch',
    'leiter@hm-catering.de',
    'STANDLEITER',
    'de',
    '+49 176 33445566',
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'Jonas Weber',
    'mitarbeiter1@hm-catering.de',
    'EMPLOYEE',
    'de',
    '+49 176 44556677',
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'b1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'Laura Schmidt',
    'mitarbeiter2@hm-catering.de',
    'EMPLOYEE',
    'de',
    '+49 176 55667788',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VEHICLES
-- =============================================
INSERT INTO vehicles (id, tenant_id, name, license_plate, type, status, notes)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Transporter Berlin',
    'B-HM 1234',
    'VAN',
    'ACTIVE',
    'Mercedes Sprinter, 3.5t. Kühlbox vorhanden.'
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Pickup Frankfurt',
    'F-HM 5678',
    'PICKUP',
    'ACTIVE',
    'Ford Ranger. Für Materialanlieferung.'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FOODTRUCKS
-- =============================================
INSERT INTO foodtrucks (id, tenant_id, name, type, status, notes)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Bratwurst Express',
    'Grillwagen',
    'ACTIVE',
    'Gasgrillwagen, 4m Breite, Anschluss 32A.'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Burger Queen',
    'Foodtruck',
    'ACTIVE',
    'Voll ausgestatteter Burgertruk. TÜV bis 2025.'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- COOLING TRAILERS
-- =============================================
INSERT INTO cooling_trailers (id, tenant_id, name, status, notes)
VALUES
  (
    'f1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Kühlanhänger 1',
    'ACTIVE',
    'Isobox 3m, Diesel-Aggregat. Kapazität 800L.'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EQUIPMENT
-- =============================================
INSERT INTO equipment (id, tenant_id, name, category, status, notes)
VALUES
  (
    'g1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Festzeltgarnitur Set A',
    'Möbel',
    'ACTIVE',
    '10 Tische + 80 Bänke. Biertischgarnitur.'
  ),
  (
    'g1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Zelt 10x5m',
    'Zelte',
    'ACTIVE',
    'Faltzelt, wetterfest, inkl. Seitenteile.'
  ),
  (
    'g1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Stromgenerator 20kVA',
    'Technik',
    'ACTIVE',
    'Diesel, 3 Phasen. Verbrauch ca. 5L/h.'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PRODUCT CATEGORIES
-- =============================================
INSERT INTO product_categories (id, tenant_id, name, sort_order)
VALUES
  (
    'h1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Getränke',
    1
  ),
  (
    'h1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Speisen',
    2
  ),
  (
    'h1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Verbrauchsmaterial',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PRODUCTS
-- =============================================
INSERT INTO products (id, tenant_id, name, category_id, unit, is_active)
VALUES
  (
    'i1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Coca Cola 0,33L',
    'h1000000-0000-0000-0000-000000000001',
    'Dose',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Wasser 0,5L',
    'h1000000-0000-0000-0000-000000000001',
    'Flasche',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Bier 0,5L',
    'h1000000-0000-0000-0000-000000000001',
    'Flasche',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'Bratwurst',
    'h1000000-0000-0000-0000-000000000002',
    'Stück',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'Burger Classic',
    'h1000000-0000-0000-0000-000000000002',
    'Stück',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000001',
    'Pommes Frites',
    'h1000000-0000-0000-0000-000000000002',
    'Portion',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000001',
    'Servietten 500er Pack',
    'h1000000-0000-0000-0000-000000000003',
    'Pack',
    TRUE
  ),
  (
    'i1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000001',
    'Einwegbecher 0,3L',
    'h1000000-0000-0000-0000-000000000003',
    'Stück',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CHECKLIST TEMPLATES
-- =============================================
INSERT INTO checklist_templates (id, tenant_id, name, description, category, is_active)
VALUES
  (
    'j1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Tägliche Hygieneprüfung',
    'Standardcheckliste für tägliche Hygienekontrollen am Stand',
    'HYGIENE',
    TRUE
  ),
  (
    'j1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Fahrzeugcheck vor Abfahrt',
    'Pflichtcheck vor jeder Fahrt mit Firmenfahrzeugen',
    'VEHICLE',
    TRUE
  ),
  (
    'j1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Abbau & Reinigung',
    'Abschlusskontrolle nach Veranstaltungsende',
    'CLEANING',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Checklist Template Items
INSERT INTO checklist_template_items (id, template_id, label, label_en, label_es, item_type, is_required, sort_order)
VALUES
  -- Hygiene checklist
  ('k1000000-0000-0000-0000-000000000001', 'j1000000-0000-0000-0000-000000000001', 'Hände desinfiziert', 'Hands sanitized', 'Manos desinfectadas', 'CHECKBOX', TRUE, 1),
  ('k1000000-0000-0000-0000-000000000002', 'j1000000-0000-0000-0000-000000000001', 'Arbeitsflächen gereinigt', 'Work surfaces cleaned', 'Superficies de trabajo limpias', 'CHECKBOX', TRUE, 2),
  ('k1000000-0000-0000-0000-000000000003', 'j1000000-0000-0000-0000-000000000001', 'Kühltemperatur geprüft (°C)', 'Cooling temperature checked (°C)', 'Temperatura de refrigeración verificada (°C)', 'NUMBER', TRUE, 3),
  ('k1000000-0000-0000-0000-000000000004', 'j1000000-0000-0000-0000-000000000001', 'Foto Arbeitsbereich', 'Photo work area', 'Foto área de trabajo', 'PHOTO', FALSE, 4),
  ('k1000000-0000-0000-0000-000000000005', 'j1000000-0000-0000-0000-000000000001', 'Abfall entsorgt', 'Waste disposed', 'Residuos desechados', 'CHECKBOX', TRUE, 5),
  ('k1000000-0000-0000-0000-000000000006', 'j1000000-0000-0000-0000-000000000001', 'Anmerkungen', 'Notes', 'Observaciones', 'TEXT', FALSE, 6),
  -- Vehicle check
  ('k1000000-0000-0000-0000-000000000007', 'j1000000-0000-0000-0000-000000000002', 'Reifendruck geprüft', 'Tire pressure checked', 'Presión de neumáticos verificada', 'CHECKBOX', TRUE, 1),
  ('k1000000-0000-0000-0000-000000000008', 'j1000000-0000-0000-0000-000000000002', 'Beleuchtung funktionsfähig', 'Lighting functional', 'Iluminación funcional', 'CHECKBOX', TRUE, 2),
  ('k1000000-0000-0000-0000-000000000009', 'j1000000-0000-0000-0000-000000000002', 'Kraftstoff ausreichend', 'Fuel sufficient', 'Combustible suficiente', 'CHECKBOX', TRUE, 3),
  ('k1000000-0000-0000-0000-000000000010', 'j1000000-0000-0000-0000-000000000002', 'Fahrzeugschein vorhanden', 'Vehicle registration present', 'Documentación del vehículo presente', 'CHECKBOX', TRUE, 4),
  ('k1000000-0000-0000-0000-000000000011', 'j1000000-0000-0000-0000-000000000002', 'Kilometerstand', 'Odometer reading', 'Lectura del odómetro', 'NUMBER', FALSE, 5),
  -- Cleanup checklist
  ('k1000000-0000-0000-0000-000000000012', 'j1000000-0000-0000-0000-000000000003', 'Stand vollständig abgebaut', 'Stand completely dismantled', 'Puesto completamente desmontado', 'CHECKBOX', TRUE, 1),
  ('k1000000-0000-0000-0000-000000000013', 'j1000000-0000-0000-0000-000000000003', 'Fläche gereinigt und besenrein', 'Area cleaned and swept', 'Área limpia y barrida', 'CHECKBOX', TRUE, 2),
  ('k1000000-0000-0000-0000-000000000014', 'j1000000-0000-0000-0000-000000000003', 'Abfall entsorgt', 'Waste disposed', 'Residuos desechados', 'CHECKBOX', TRUE, 3),
  ('k1000000-0000-0000-0000-000000000015', 'j1000000-0000-0000-0000-000000000003', 'Foto Abbauzustand', 'Photo dismantling state', 'Foto estado de desmontaje', 'PHOTO', TRUE, 4),
  ('k1000000-0000-0000-0000-000000000016', 'j1000000-0000-0000-0000-000000000003', 'Unterschrift Standleiter', 'Signature stand manager', 'Firma jefe de puesto', 'SIGNATURE', TRUE, 5)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ONBOARDING MODULES
-- =============================================
INSERT INTO onboarding_modules (id, tenant_id, title_de, title_en, title_es, content_de, content_en, content_es, sort_order, is_active)
VALUES
  (
    'l1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Willkommen bei H+M Catering',
    'Welcome to H+M Catering',
    'Bienvenido a H+M Catering',
    'Herzlich willkommen im Team von H+M Catering GmbH! Wir freuen uns, dich als neues Teammitglied begrüßen zu dürfen.

In dieser App findest du alle wichtigen Informationen zu deinen Einsätzen: Veranstaltungsdetails, Schichtzeiten, Checklisten und vieles mehr.

**Wichtige Regeln:**
- Pünktlichkeit ist bei uns oberstes Gebot
- Hygiene geht vor – wasche und desinfiziere regelmäßig deine Hände
- Bei Fragen wende dich immer an deinen Standleiter
- Im Notfall ruf die Notfallnummer an (im Veranstaltungsdetail hinterlegt)',
    'Welcome to the H+M Catering GmbH team! We are pleased to welcome you as a new team member.

In this app you will find all important information about your assignments: event details, shift times, checklists and much more.

**Important rules:**
- Punctuality is our top priority
- Hygiene first – wash and sanitize your hands regularly
- If you have questions, always contact your stand manager
- In an emergency, call the emergency number (stored in the event detail)',
    '¡Bienvenido al equipo de H+M Catering GmbH! Nos alegra darte la bienvenida como nuevo miembro del equipo.

En esta aplicación encontrarás toda la información importante sobre tus asignaciones: detalles del evento, horarios de turno, listas de verificación y mucho más.

**Reglas importantes:**
- La puntualidad es nuestra máxima prioridad
- La higiene es lo primero: lávate y desinfecta las manos regularmente
- Si tienes preguntas, siempre contacta a tu jefe de puesto
- En caso de emergencia, llama al número de emergencia (almacenado en el detalle del evento)',
    1,
    TRUE
  ),
  (
    'l1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Hygiene & Lebensmittelsicherheit',
    'Hygiene & Food Safety',
    'Higiene y Seguridad Alimentaria',
    'Als Mitarbeiter im Lebensmittelbereich bist du gesetzlich verpflichtet, bestimmte Hygienestandards einzuhalten.

**Persönliche Hygiene:**
- Saubere Arbeitskleidung täglich
- Haare müssen bedeckt sein (Haarnetz/Mütze)
- Keine Ringe oder Armbänder am Arbeitsplatz
- Regelmäßiges Händewaschen und -desinfizieren

**Lebensmittelsicherheit:**
- Kühlkette niemals unterbrechen
- Verfallsdaten täglich prüfen
- Cross-Kontamination vermeiden (rohe und fertige Produkte getrennt)
- Temperaturen dokumentieren (Kühlschrank: max. 7°C)',
    'As an employee in the food sector, you are legally obliged to comply with certain hygiene standards.

**Personal hygiene:**
- Clean work clothes daily
- Hair must be covered (hairnet/cap)
- No rings or bracelets at the workplace
- Regular hand washing and sanitizing

**Food safety:**
- Never break the cold chain
- Check expiry dates daily
- Avoid cross-contamination (separate raw and finished products)
- Document temperatures (refrigerator: max. 7°C)',
    'Como empleado en el sector alimentario, estás legalmente obligado a cumplir ciertos estándares de higiene.

**Higiene personal:**
- Ropa de trabajo limpia diariamente
- El cabello debe estar cubierto (redecilla/gorro)
- Sin anillos ni pulseras en el lugar de trabajo
- Lavado y desinfección regular de manos

**Seguridad alimentaria:**
- Nunca romper la cadena de frío
- Verificar fechas de caducidad diariamente
- Evitar la contaminación cruzada (separar productos crudos y terminados)
- Documentar temperaturas (refrigerador: máx. 7°C)',
    2,
    TRUE
  ),
  (
    'l1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'App-Nutzung & Zeiterfassung',
    'App Usage & Time Tracking',
    'Uso de la App y Registro de Tiempo',
    'Die EventHub-App ist dein zentrales Werkzeug für alle Einsätze.

**Zeiterfassung:**
1. Gehe zu "Meine Zeiten"
2. Wähle die Veranstaltung aus
3. Klicke auf "Einstempeln" wenn du ankommst
4. Vergiss nicht auszustempeln am Ende deines Einsatzes

**Wichtig:**
- Stempele immer vor Ort ein/aus (GPS wird aufgezeichnet)
- Pausen werden separat erfasst
- Bei technischen Problemen wende dich an deinen Vorgesetzten

**Kassenblatt:**
Am Ende jedes Veranstaltungstages muss ein Kassenblatt ausgefüllt werden. Zähle das Geld sorgfältig und mache ein Foto der Kasse.',
    'The EventHub app is your central tool for all assignments.

**Time tracking:**
1. Go to "My Times"
2. Select the event
3. Click "Clock In" when you arrive
4. Don\'t forget to clock out at the end of your assignment

**Important:**
- Always clock in/out on site (GPS is recorded)
- Breaks are recorded separately
- For technical problems, contact your supervisor

**Cash report:**
At the end of each event day, a cash report must be completed. Count the money carefully and take a photo of the cash register.',
    'La aplicación EventHub es tu herramienta central para todas las asignaciones.

**Registro de tiempo:**
1. Ve a "Mis Tiempos"
2. Selecciona el evento
3. Haz clic en "Fichar Entrada" cuando llegues
4. No olvides fichar la salida al final de tu turno

**Importante:**
- Siempre ficha entrada/salida in situ (se registra el GPS)
- Los descansos se registran por separado
- Para problemas técnicos, contacta a tu supervisor

**Informe de caja:**
Al final de cada día de evento, se debe completar un informe de caja. Cuenta el dinero cuidadosamente y toma una foto de la caja.',
    3,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EVENTS
-- =============================================
INSERT INTO events (
  id, tenant_id, title, event_type, start_date, end_date,
  start_time, end_time, departure_time, status,
  address, city, postal_code, country,
  organizer_name, organizer_contact,
  stand_contact_name, stand_contact_phone,
  stand_number, emergency_phone, internal_notes,
  created_by
)
VALUES
  (
    'm1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Sommerfest Stadtpark 2024',
    'FESTIVAL',
    '2024-07-19',
    '2024-07-21',
    '11:00',
    '23:00',
    '08:30',
    'COMPLETED',
    'Stadtpark Allee 1',
    'Berlin',
    '10115',
    'DE',
    'Stadtwerk Berlin GmbH',
    'kontakt@stadtwerk-berlin.de',
    'Sandra Koch',
    '+49 176 33445566',
    'Stand 42A',
    '+49 30 1234567',
    'Standplatz direkt am Haupteingang. Stromanschluss 32A vorhanden. Wasser am Stand B12.',
    'c1000000-0000-0000-0000-000000000001'
  ),
  (
    'm1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Firmenfeier Mustermann AG',
    'CORPORATE',
    '2024-08-15',
    '2024-08-15',
    '17:00',
    '22:00',
    '14:00',
    'COMPLETED',
    'Musterstraße 99',
    'Hamburg',
    '20095',
    'DE',
    'Mustermann AG',
    'events@mustermann.de',
    'Thomas Müller',
    '+49 176 22334455',
    NULL,
    '+49 40 9876543',
    'Catering für 200 Personen. Vegetarische Optionen ausreichend einplanen (ca. 30%).',
    'c1000000-0000-0000-0000-000000000001'
  ),
  (
    'm1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Weihnachtsmarkt Frankfurt 2024',
    'MARKET',
    '2024-11-25',
    '2024-12-23',
    '10:00',
    '21:00',
    '07:00',
    'CONFIRMED',
    'Römerberg 1',
    'Frankfurt am Main',
    '60311',
    'DE',
    'Frankfurt Tourismus GmbH',
    'markt@frankfurt-tourismus.de',
    'Sandra Koch',
    '+49 176 33445566',
    'Hütte 15',
    '+49 69 1234567',
    'Glühwein-Lizenz vorhanden. Strombedarf: 3x32A. Reservierte Parkplätze für Anlieferung beim Veranstalter anfragen.',
    'c1000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EVENT DAYS
-- =============================================
-- Event 1: Sommerfest (3 days)
INSERT INTO event_days (id, tenant_id, event_id, event_date, day_label, status)
VALUES
  ('n1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', '2024-07-19', 'Tag 1', 'COMPLETED'),
  ('n1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', '2024-07-20', 'Tag 2', 'COMPLETED'),
  ('n1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', '2024-07-21', 'Tag 3', 'COMPLETED'),
  -- Event 2: Firmenfeier (1 day)
  ('n1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000002', '2024-08-15', 'Tag 1', 'COMPLETED'),
  -- Event 3: Weihnachtsmarkt (first 3 days as sample)
  ('n1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000003', '2024-11-25', 'Tag 1', 'OPEN'),
  ('n1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000003', '2024-11-26', 'Tag 2', 'OPEN'),
  ('n1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000003', '2024-11-27', 'Tag 3', 'OPEN')
ON CONFLICT (event_id, event_date) DO NOTHING;

-- =============================================
-- EVENT ASSIGNMENTS
-- =============================================
-- Event 1: Sommerfest
INSERT INTO event_assignments (id, tenant_id, event_id, user_id, role_in_event)
VALUES
  ('o1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'STANDLEITER'),
  ('o1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'EMPLOYEE'),
  ('o1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'EMPLOYEE'),
  -- Event 2: Firmenfeier
  ('o1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'STANDLEITER'),
  ('o1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', 'EMPLOYEE'),
  -- Event 3: Weihnachtsmarkt
  ('o1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'STANDLEITER'),
  ('o1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'EMPLOYEE'),
  ('o1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'EMPLOYEE')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- =============================================
-- EVENT LOGISTICS ASSIGNMENTS
-- =============================================
INSERT INTO event_logistics_assignments (id, tenant_id, event_id, vehicle_id, foodtruck_id, cooling_trailer_id, equipment_notes)
VALUES
  (
    'p1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000001',
    'Festzeltgarnitur Set A, Zelt 10x5m, Stromgenerator 20kVA'
  ),
  (
    'p1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000002',
    'e1000000-0000-0000-0000-000000000002',
    NULL,
    'Festzeltgarnitur Set A für Indoor-Bereich'
  ),
  (
    'p1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000001',
    'Glühweinkocher, Heizstrahler 4x'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CASH REPORTS (for completed events)
-- =============================================
INSERT INTO cash_reports (
  id, tenant_id, event_id, event_day_id,
  submitted_by_user_id, submitted_at, status,
  total_amount, notes
)
VALUES
  (
    'q1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'n1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    '2024-07-19 23:30:00',
    'FINAL',
    1842.50,
    'Sehr guter Tag. Viele Besucher am Abend.'
  ),
  (
    'q1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'n1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003',
    '2024-07-20 23:15:00',
    'FINAL',
    2103.00,
    'Bester Tag des Festivals. Ausverkauft ab 20 Uhr.'
  ),
  (
    'q1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'n1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000003',
    '2024-07-21 22:45:00',
    'FINAL',
    1567.80,
    'Regen ab 18 Uhr, weniger Besucher als erwartet.'
  ),
  (
    'q1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000002',
    'n1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000002',
    '2024-08-15 22:30:00',
    'FINAL',
    3200.00,
    'Firmenfeier lief hervorragend. Alle Gäste sehr zufrieden.'
  )
ON CONFLICT (event_day_id) DO NOTHING;

-- Sample denominations for first cash report
INSERT INTO cash_report_denominations (id, cash_report_id, denomination_type, denomination_value, quantity, subtotal)
VALUES
  ('r1000000-0000-0000-0000-000000000001', 'q1000000-0000-0000-0000-000000000001', 'NOTE', 50, 20, 1000.00),
  ('r1000000-0000-0000-0000-000000000002', 'q1000000-0000-0000-0000-000000000001', 'NOTE', 20, 25, 500.00),
  ('r1000000-0000-0000-0000-000000000003', 'q1000000-0000-0000-0000-000000000001', 'NOTE', 10, 15, 150.00),
  ('r1000000-0000-0000-0000-000000000004', 'q1000000-0000-0000-0000-000000000001', 'NOTE', 5, 22, 110.00),
  ('r1000000-0000-0000-0000-000000000005', 'q1000000-0000-0000-0000-000000000001', 'COIN', 2, 15, 30.00),
  ('r1000000-0000-0000-0000-000000000006', 'q1000000-0000-0000-0000-000000000001', 'COIN', 1, 25, 25.00),
  ('r1000000-0000-0000-0000-000000000007', 'q1000000-0000-0000-0000-000000000001', 'COIN', 0.5, 15, 7.50),
  ('r1000000-0000-0000-0000-000000000008', 'q1000000-0000-0000-0000-000000000001', 'COIN', 0.2, 50, 10.00),
  ('r1000000-0000-0000-0000-000000000009', 'q1000000-0000-0000-0000-000000000001', 'COIN', 0.1, 100, 10.00)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- TIME ENTRIES (for completed events)
-- =============================================
INSERT INTO time_entries (id, tenant_id, event_id, user_id, clock_in, clock_out, break_minutes, status)
VALUES
  -- Event 1, Day 1 - Sandra Koch
  (
    's1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    '2024-07-19 08:30:00',
    '2024-07-19 23:15:00',
    45,
    'APPROVED'
  ),
  -- Event 1, Day 1 - Jonas Weber
  (
    's1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000004',
    '2024-07-19 09:00:00',
    '2024-07-19 23:00:00',
    60,
    'APPROVED'
  ),
  -- Event 1, Day 1 - Laura Schmidt
  (
    's1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000005',
    '2024-07-19 09:00:00',
    '2024-07-19 22:30:00',
    30,
    'APPROVED'
  ),
  -- Event 2 - Thomas Müller
  (
    's1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    '2024-08-15 14:00:00',
    '2024-08-15 22:30:00',
    30,
    'APPROVED'
  ),
  -- Event 2 - Jonas Weber
  (
    's1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000004',
    '2024-08-15 14:30:00',
    '2024-08-15 22:00:00',
    30,
    'APPROVED'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FEED ENTRIES
-- =============================================
INSERT INTO event_feed_entries (id, tenant_id, event_id, user_id, content, category)
VALUES
  (
    't1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'Stand ist aufgebaut und bereit. Alle Produkte vorhanden.',
    'INFO'
  ),
  (
    't1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000004',
    'Kleiner Kratzer am Transporter beim Einparken entdeckt. Foto angehängt.',
    'DAMAGE'
  ),
  (
    't1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'Bier bis 19 Uhr ausverkauft. Nachlieferung für morgen organisiert.',
    'INFO'
  ),
  (
    't1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'Veranstaltung erfolgreich abgeschlossen. Sehr positive Rückmeldungen vom Kunden.',
    'NOTE'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PRODUCT PASSES (Rezepturen)
-- =============================================
INSERT INTO product_passes (id, tenant_id, product_id, title, recipe_de, recipe_en, recipe_es)
VALUES
  (
    'u1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'i1000000-0000-0000-0000-000000000005',
    'Burger Classic - Zubereitung',
    '**Zutaten (1 Portion):**
- 180g Rinderhackfleisch (mind. 20% Fett)
- 1 Brioche-Bun
- 2 Scheiben Cheddar
- Salat, Tomate, rote Zwiebel
- Hausgemachte Burgersauce

**Zubereitung:**
1. Hackfleisch zu einem Patty formen (2cm Dicke)
2. Grillplatte auf 200°C vorheizen
3. Patty 4 Min. pro Seite grillen
4. Käse in letzter Minute auflegen
5. Bun anrösten, Sauce auftragen
6. Belegen und sofort servieren

**Kerntemperatur:** mind. 72°C!',
    '**Ingredients (1 serving):**
- 180g ground beef (min. 20% fat)
- 1 brioche bun
- 2 slices cheddar
- Lettuce, tomato, red onion
- House burger sauce

**Preparation:**
1. Form ground beef into a patty (2cm thick)
2. Preheat grill plate to 200°C
3. Grill patty 4 min. per side
4. Add cheese in last minute
5. Toast bun, apply sauce
6. Top and serve immediately

**Core temperature:** min. 72°C!',
    '**Ingredientes (1 porción):**
- 180g carne picada de res (mín. 20% grasa)
- 1 pan brioche
- 2 lonchas de cheddar
- Lechuga, tomate, cebolla roja
- Salsa de hamburguesa casera

**Preparación:**
1. Formar la carne picada en una hamburguesa (2cm de grosor)
2. Precalentar la plancha a 200°C
3. Asar la hamburguesa 4 min. por cada lado
4. Añadir queso en el último minuto
5. Tostar el pan, aplicar salsa
6. Cubrir y servir inmediatamente

**Temperatura central:** mín. 72°C!'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ACTIVITY LOGS
-- =============================================
INSERT INTO activity_logs (id, tenant_id, user_id, action, resource_type, resource_id, metadata)
VALUES
  (
    'v1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'CREATE',
    'event',
    'm1000000-0000-0000-0000-000000000001',
    '{"event_title": "Sommerfest Stadtpark 2024"}'
  ),
  (
    'v1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'CREATE',
    'event',
    'm1000000-0000-0000-0000-000000000002',
    '{"event_title": "Firmenfeier Mustermann AG"}'
  ),
  (
    'v1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'CREATE',
    'event',
    'm1000000-0000-0000-0000-000000000003',
    '{"event_title": "Weihnachtsmarkt Frankfurt 2024"}'
  ),
  (
    'v1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'SUBMIT',
    'cash_report',
    'q1000000-0000-0000-0000-000000000001',
    '{"total_amount": 1842.50, "event_day": "Tag 1"}'
  ),
  (
    'v1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'FINALIZE',
    'cash_report',
    'q1000000-0000-0000-0000-000000000001',
    '{"total_amount": 1842.50, "finalized_by": "Maria Hoffmann"}'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RE-ENABLE RLS
-- =============================================
SET session_replication_role = DEFAULT;

-- =============================================
-- SUMMARY
-- =============================================
-- Demo accounts created:
--   admin@hm-catering.de      (TENANT_ADMIN)  → /dashboard
--   manager@hm-catering.de    (EVENT_MANAGER) → /dashboard
--   leiter@hm-catering.de     (STANDLEITER)   → /my-events
--   mitarbeiter1@hm-catering.de (EMPLOYEE)    → /my-events
--   mitarbeiter2@hm-catering.de (EMPLOYEE)    → /my-events
--
-- All passwords: EventHub2024!
--
-- Tenant: H+M Catering GmbH (hm-catering)
-- Events: 3 (Sommerfest, Firmenfeier, Weihnachtsmarkt)
-- Products: 8 across 3 categories
-- Templates: 3 (Hygiene, Fahrzeug, Abbau)
-- Onboarding: 3 multilingual modules
