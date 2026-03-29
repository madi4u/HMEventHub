-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY')),
  preferred_language TEXT NOT NULL DEFAULT 'de' CHECK (preferred_language IN ('de', 'en', 'es')),
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'FESTIVAL' CHECK (event_type IN ('FESTIVAL', 'CORPORATE', 'PRIVATE', 'MARKET', 'CATERING', 'OTHER')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  departure_time TIME,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'DE',
  google_maps_url TEXT,
  apple_maps_url TEXT,
  organizer_name TEXT,
  organizer_contact TEXT,
  stand_contact_name TEXT,
  stand_contact_phone TEXT,
  stand_number TEXT,
  emergency_phone TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Days (auto-generated)
CREATE TABLE event_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  day_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, event_date)
);

-- Event Assignments (users to events)
CREATE TABLE event_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_in_event TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role_in_event IN ('STANDLEITER', 'EMPLOYEE', 'DRIVER', 'SUPPORT')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  license_plate TEXT,
  type TEXT DEFAULT 'VAN',
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'IN_REPAIR')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foodtrucks
CREATE TABLE foodtrucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cooling Trailers
CREATE TABLE cooling_trailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Logistics Assignments
CREATE TABLE event_logistics_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  foodtruck_id UUID REFERENCES foodtrucks(id),
  cooling_trailer_id UUID REFERENCES cooling_trailers(id),
  equipment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  unit TEXT NOT NULL DEFAULT 'Stück',
  notes TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Sessions
CREATE TABLE event_inventory_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_day_id UUID REFERENCES event_days(id),
  session_type TEXT NOT NULL CHECK (session_type IN ('INTAKE', 'RETURN', 'COUNT')),
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE event_inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES event_inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT
);

-- Time Entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  break_minutes INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'APPROVED')),
  location_in JSONB,
  location_out JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Reports
CREATE TABLE cash_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_day_id UUID NOT NULL REFERENCES event_days(id),
  submitted_by_user_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SUBMITTED', 'FINAL')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  signature_file_path TEXT,
  cash_photo_file_path TEXT,
  pdf_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_day_id)
);

-- Cash Report Denominations
CREATE TABLE cash_report_denominations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_report_id UUID NOT NULL REFERENCES cash_reports(id) ON DELETE CASCADE,
  denomination_type TEXT NOT NULL CHECK (denomination_type IN ('NOTE', 'COIN')),
  denomination_value DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Checklist Templates
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'HYGIENE', 'VEHICLE', 'CLEANING', 'OTHER')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Template Items
CREATE TABLE checklist_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  label_en TEXT,
  label_es TEXT,
  item_type TEXT NOT NULL DEFAULT 'CHECKBOX' CHECK (item_type IN ('CHECKBOX', 'TEXT', 'NUMBER', 'DATE', 'PHOTO', 'SIGNATURE')),
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  options JSONB
);

-- Checklist Runs
CREATE TABLE event_checklist_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES checklist_templates(id),
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  signature_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Answers
CREATE TABLE event_checklist_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES event_checklist_runs(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES checklist_template_items(id),
  value TEXT,
  photo_url TEXT,
  UNIQUE(run_id, template_item_id)
);

-- Feed Entries
CREATE TABLE event_feed_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT,
  category TEXT DEFAULT 'NOTE' CHECK (category IN ('DAMAGE', 'INFO', 'PHOTO', 'NOTE')),
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed Attachments
CREATE TABLE event_feed_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_entry_id UUID NOT NULL REFERENCES event_feed_entries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Documents
CREATE TABLE event_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  category TEXT DEFAULT 'OTHER' CHECK (category IN ('ID', 'TICKET', 'CONTRACT', 'PHOTO', 'PDF', 'OTHER')),
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Exports
CREATE TABLE event_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'FULL' CHECK (export_type IN ('FULL', 'CASH_REPORT', 'CHECKLIST', 'TEAM')),
  file_path TEXT,
  created_by_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Modules
CREATE TABLE onboarding_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title_de TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  content_de TEXT,
  content_en TEXT,
  content_es TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Assets
CREATE TABLE onboarding_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES onboarding_modules(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('IMAGE', 'VIDEO', 'PDF')),
  title TEXT,
  sort_order INT DEFAULT 0
);

-- Product Passes (Rezepturen)
CREATE TABLE product_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID REFERENCES products(id),
  title TEXT NOT NULL,
  recipe_de TEXT,
  recipe_en TEXT,
  recipe_es TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_days_event_id ON event_days(event_id);
CREATE INDEX idx_event_assignments_event_id ON event_assignments(event_id);
CREATE INDEX idx_event_assignments_user_id ON event_assignments(user_id);
CREATE INDEX idx_time_entries_event_id ON time_entries(event_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_cash_reports_event_id ON cash_reports(event_id);
CREATE INDEX idx_cash_reports_event_day_id ON cash_reports(event_day_id);
CREATE INDEX idx_feed_entries_event_id ON event_feed_entries(event_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cash_reports_updated_at BEFORE UPDATE ON cash_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER onboarding_modules_updated_at BEFORE UPDATE ON onboarding_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'EMPLOYEE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
