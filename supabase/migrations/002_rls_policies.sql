-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE foodtrucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooling_trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logistics_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_report_denominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checklist_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checklist_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feed_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feed_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's tenant_id
CREATE OR REPLACE FUNCTION my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's profile id
CREATE OR REPLACE FUNCTION my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT role = 'SUPERADMIN' FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is admin or higher
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER') FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is event manager or higher
CREATE OR REPLACE FUNCTION is_event_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER') FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is user assigned to event
CREATE OR REPLACE FUNCTION is_assigned_to_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_assignments ea
    WHERE ea.event_id = p_event_id AND ea.user_id = my_profile_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ====================
-- TENANTS
-- ====================
CREATE POLICY "superadmin_all_tenants"
  ON tenants FOR ALL USING (is_superadmin());

CREATE POLICY "members_view_own_tenant"
  ON tenants FOR SELECT USING (id = my_tenant_id());

-- ====================
-- PROFILES
-- ====================
CREATE POLICY "superadmin_all_profiles"
  ON profiles FOR ALL USING (is_superadmin());

CREATE POLICY "users_view_same_tenant_profiles"
  ON profiles FOR SELECT USING (
    tenant_id = my_tenant_id()
  );

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "admins_update_tenant_profiles"
  ON profiles FOR UPDATE USING (
    is_admin() AND tenant_id = my_tenant_id()
  );

CREATE POLICY "allow_profile_insert_on_signup"
  ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- ====================
-- EVENTS
-- ====================
CREATE POLICY "managers_manage_events"
  ON events FOR ALL USING (
    tenant_id = my_tenant_id() AND is_event_manager()
  );

CREATE POLICY "employees_view_assigned_events"
  ON events FOR SELECT USING (
    tenant_id = my_tenant_id() AND is_assigned_to_event(id)
  );

CREATE POLICY "superadmin_view_all_events"
  ON events FOR SELECT USING (is_superadmin());

-- ====================
-- EVENT DAYS
-- ====================
CREATE POLICY "managers_manage_event_days"
  ON event_days FOR ALL USING (
    tenant_id = my_tenant_id() AND is_event_manager()
  );

CREATE POLICY "assigned_users_view_event_days"
  ON event_days FOR SELECT USING (
    tenant_id = my_tenant_id() AND is_assigned_to_event(event_id)
  );

-- ====================
-- EVENT ASSIGNMENTS
-- ====================
CREATE POLICY "managers_manage_assignments"
  ON event_assignments FOR ALL USING (
    tenant_id = my_tenant_id() AND is_event_manager()
  );

CREATE POLICY "users_view_own_assignments"
  ON event_assignments FOR SELECT USING (
    tenant_id = my_tenant_id() AND (
      is_event_manager() OR user_id = my_profile_id()
    )
  );

-- ====================
-- VEHICLES
-- ====================
CREATE POLICY "tenant_view_vehicles"
  ON vehicles FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_vehicles"
  ON vehicles FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

-- ====================
-- FOODTRUCKS
-- ====================
CREATE POLICY "tenant_view_foodtrucks"
  ON foodtrucks FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_foodtrucks"
  ON foodtrucks FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

-- ====================
-- COOLING TRAILERS
-- ====================
CREATE POLICY "tenant_view_cooling_trailers"
  ON cooling_trailers FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_cooling_trailers"
  ON cooling_trailers FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

-- ====================
-- EQUIPMENT
-- ====================
CREATE POLICY "tenant_view_equipment"
  ON equipment FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_equipment"
  ON equipment FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

-- ====================
-- LOGISTICS ASSIGNMENTS
-- ====================
CREATE POLICY "managers_manage_logistics"
  ON event_logistics_assignments FOR ALL USING (
    tenant_id = my_tenant_id() AND is_event_manager()
  );
CREATE POLICY "assigned_view_logistics"
  ON event_logistics_assignments FOR SELECT USING (
    tenant_id = my_tenant_id() AND is_assigned_to_event(event_id)
  );

-- ====================
-- PRODUCTS
-- ====================
CREATE POLICY "tenant_view_products"
  ON products FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_products"
  ON products FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

CREATE POLICY "tenant_view_categories"
  ON product_categories FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_categories"
  ON product_categories FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

-- ====================
-- TIME ENTRIES
-- ====================
CREATE POLICY "users_manage_own_time_entries"
  ON time_entries FOR ALL USING (
    tenant_id = my_tenant_id() AND (
      user_id = my_profile_id() OR is_event_manager()
    )
  );

-- ====================
-- CASH REPORTS
-- ====================
CREATE POLICY "assigned_view_cash_reports"
  ON cash_reports FOR SELECT USING (
    tenant_id = my_tenant_id() AND (
      is_event_manager() OR is_assigned_to_event(event_id)
    )
  );

CREATE POLICY "assigned_create_open_cash_reports"
  ON cash_reports FOR INSERT WITH CHECK (
    tenant_id = my_tenant_id() AND is_assigned_to_event(event_id)
  );

CREATE POLICY "assigned_update_open_cash_reports"
  ON cash_reports FOR UPDATE USING (
    tenant_id = my_tenant_id() AND status != 'FINAL' AND (
      is_assigned_to_event(event_id) OR is_event_manager()
    )
  );

CREATE POLICY "admins_finalize_cash_reports"
  ON cash_reports FOR UPDATE USING (
    tenant_id = my_tenant_id() AND is_admin()
  );

-- ====================
-- CASH REPORT DENOMINATIONS
-- ====================
CREATE POLICY "denominations_follow_report_access"
  ON cash_report_denominations FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cash_reports cr
      WHERE cr.id = cash_report_id
        AND cr.tenant_id = my_tenant_id()
        AND (is_event_manager() OR is_assigned_to_event(cr.event_id))
    )
  );

-- ====================
-- CHECKLIST TEMPLATES
-- ====================
CREATE POLICY "tenant_view_templates"
  ON checklist_templates FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_templates"
  ON checklist_templates FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

CREATE POLICY "tenant_view_template_items"
  ON checklist_template_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM checklist_templates ct WHERE ct.id = template_id AND ct.tenant_id = my_tenant_id())
  );
CREATE POLICY "admin_manage_template_items"
  ON checklist_template_items FOR ALL USING (
    EXISTS (SELECT 1 FROM checklist_templates ct WHERE ct.id = template_id AND ct.tenant_id = my_tenant_id() AND is_admin())
  );

-- ====================
-- CHECKLIST RUNS
-- ====================
CREATE POLICY "assigned_view_checklist_runs"
  ON event_checklist_runs FOR SELECT USING (
    tenant_id = my_tenant_id() AND (is_event_manager() OR is_assigned_to_event(event_id))
  );

CREATE POLICY "assigned_create_checklist_runs"
  ON event_checklist_runs FOR INSERT WITH CHECK (
    tenant_id = my_tenant_id() AND is_assigned_to_event(event_id)
  );

CREATE POLICY "users_update_own_runs"
  ON event_checklist_runs FOR UPDATE USING (
    tenant_id = my_tenant_id() AND (
      completed_by = my_profile_id() OR is_event_manager()
    )
  );

-- ====================
-- CHECKLIST ANSWERS
-- ====================
CREATE POLICY "run_access_controls_answers"
  ON event_checklist_answers FOR ALL USING (
    EXISTS (
      SELECT 1 FROM event_checklist_runs r
      WHERE r.id = run_id
        AND r.tenant_id = my_tenant_id()
        AND (is_event_manager() OR is_assigned_to_event(r.event_id))
    )
  );

-- ====================
-- FEED ENTRIES
-- ====================
CREATE POLICY "assigned_view_feed"
  ON event_feed_entries FOR SELECT USING (
    tenant_id = my_tenant_id() AND (is_event_manager() OR is_assigned_to_event(event_id))
  );

CREATE POLICY "assigned_create_feed_entries"
  ON event_feed_entries FOR INSERT WITH CHECK (
    tenant_id = my_tenant_id() AND is_assigned_to_event(event_id)
  );

CREATE POLICY "admins_delete_feed_entries"
  ON event_feed_entries FOR DELETE USING (
    tenant_id = my_tenant_id() AND is_admin()
  );

-- ====================
-- FEED ATTACHMENTS
-- ====================
CREATE POLICY "feed_attachments_follow_entry"
  ON event_feed_attachments FOR ALL USING (
    EXISTS (
      SELECT 1 FROM event_feed_entries fe
      WHERE fe.id = feed_entry_id
        AND fe.tenant_id = my_tenant_id()
        AND (is_event_manager() OR is_assigned_to_event(fe.event_id))
    )
  );

-- ====================
-- EVENT DOCUMENTS
-- ====================
CREATE POLICY "assigned_view_documents"
  ON event_documents FOR SELECT USING (
    tenant_id = my_tenant_id() AND (is_event_manager() OR is_assigned_to_event(event_id))
  );

CREATE POLICY "assigned_upload_documents"
  ON event_documents FOR INSERT WITH CHECK (
    tenant_id = my_tenant_id() AND (is_event_manager() OR is_assigned_to_event(event_id))
  );

CREATE POLICY "admin_delete_documents"
  ON event_documents FOR DELETE USING (
    tenant_id = my_tenant_id() AND is_admin()
  );

-- ====================
-- EVENT EXPORTS
-- ====================
CREATE POLICY "managers_manage_exports"
  ON event_exports FOR ALL USING (
    tenant_id = my_tenant_id() AND is_event_manager()
  );

-- ====================
-- ONBOARDING
-- ====================
CREATE POLICY "tenant_view_onboarding"
  ON onboarding_modules FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_onboarding"
  ON onboarding_modules FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

CREATE POLICY "tenant_view_onboarding_assets"
  ON onboarding_assets FOR SELECT USING (
    EXISTS (SELECT 1 FROM onboarding_modules om WHERE om.id = module_id AND om.tenant_id = my_tenant_id())
  );
CREATE POLICY "admin_manage_onboarding_assets"
  ON onboarding_assets FOR ALL USING (
    EXISTS (SELECT 1 FROM onboarding_modules om WHERE om.id = module_id AND om.tenant_id = my_tenant_id() AND is_admin())
  );

-- ====================
-- PRODUCT PASSES
-- ====================
CREATE POLICY "tenant_view_product_passes"
  ON product_passes FOR SELECT USING (tenant_id = my_tenant_id());
CREATE POLICY "admin_manage_product_passes"
  ON product_passes FOR ALL USING (tenant_id = my_tenant_id() AND is_admin());

-- ====================
-- ACTIVITY LOGS
-- ====================
CREATE POLICY "admin_view_activity_logs"
  ON activity_logs FOR SELECT USING (tenant_id = my_tenant_id() AND is_admin());
CREATE POLICY "system_insert_activity_logs"
  ON activity_logs FOR INSERT WITH CHECK (tenant_id = my_tenant_id());

-- ====================
-- INVENTORY
-- ====================
CREATE POLICY "assigned_view_inventory_sessions"
  ON event_inventory_sessions FOR SELECT USING (
    tenant_id = my_tenant_id() AND (is_event_manager() OR is_assigned_to_event(event_id))
  );

CREATE POLICY "assigned_create_inventory_sessions"
  ON event_inventory_sessions FOR INSERT WITH CHECK (
    tenant_id = my_tenant_id() AND is_assigned_to_event(event_id)
  );

CREATE POLICY "inventory_items_follow_session"
  ON event_inventory_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM event_inventory_sessions eis
      WHERE eis.id = session_id
        AND eis.tenant_id = my_tenant_id()
        AND (is_event_manager() OR is_assigned_to_event(eis.event_id))
    )
  );
