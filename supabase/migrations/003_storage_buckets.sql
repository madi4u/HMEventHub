-- Storage Buckets Configuration
-- Run this in Supabase Dashboard > SQL Editor or via CLI

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'event-documents',
    'event-documents',
    false,
    52428800, -- 50MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain']
  ),
  (
    'event-photos',
    'event-photos',
    false,
    20971520, -- 20MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
  ),
  (
    'signatures',
    'signatures',
    false,
    5242880, -- 5MB
    ARRAY['image/png','image/jpeg']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'onboarding-assets',
    'onboarding-assets',
    false,
    104857600, -- 100MB
    ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf']
  ),
  (
    'cash-report-photos',
    'cash-report-photos',
    false,
    20971520, -- 20MB
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'inventory-photos',
    'inventory-photos',
    false,
    20971520, -- 20MB
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'checklist-photos',
    'checklist-photos',
    false,
    20971520, -- 20MB
    ARRAY['image/jpeg','image/png','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- ---- AVATARS (public bucket) ----
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---- EVENT DOCUMENTS ----
CREATE POLICY "Tenant members can view event documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'event-documents'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Assigned users can upload event documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-documents'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can delete event documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-documents'
    AND (
      SELECT role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER')
      FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- ---- EVENT PHOTOS ----
CREATE POLICY "Tenant members can view event photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'event-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Assigned users can upload event photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can delete event photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-photos'
    AND (
      SELECT role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER')
      FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- ---- SIGNATURES ----
CREATE POLICY "Tenant members can view signatures"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Assigned users can upload signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

-- ---- CASH REPORT PHOTOS ----
CREATE POLICY "Tenant members can view cash report photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cash-report-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Assigned users can upload cash report photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cash-report-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

-- ---- INVENTORY PHOTOS ----
CREATE POLICY "Tenant members can view inventory photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inventory-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Assigned users can upload inventory photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inventory-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

-- ---- CHECKLIST PHOTOS ----
CREATE POLICY "Tenant members can view checklist photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'checklist-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Assigned users can upload checklist photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'checklist-photos'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

-- ---- ONBOARDING ASSETS ----
CREATE POLICY "Tenant members can view onboarding assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'onboarding-assets'
    AND (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can upload onboarding assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'onboarding-assets'
    AND (
      SELECT role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER')
      FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Admins can delete onboarding assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'onboarding-assets'
    AND (
      SELECT role IN ('SUPERADMIN', 'TENANT_ADMIN', 'OWNER')
      FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );
