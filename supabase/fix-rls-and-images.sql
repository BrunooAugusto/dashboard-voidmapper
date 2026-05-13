-- ============================================================
-- VoidMapper — RLS + project_images patch
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. Fix project_images column (rename "order" → sort_order if needed) ──

-- Add sort_order if it doesn't exist yet
ALTER TABLE project_images
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- If the old "order" column exists, copy its values and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_images' AND column_name = 'order'
  ) THEN
    UPDATE project_images SET sort_order = "order";
    ALTER TABLE project_images DROP COLUMN "order";
  END IF;
END $$;

-- ── 2. Drop all existing RLS policies (clean slate) ───────────────────────

-- profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- projects
DROP POLICY IF EXISTS "projects_all"        ON projects;
DROP POLICY IF EXISTS "projects_select"     ON projects;
DROP POLICY IF EXISTS "projects_insert"     ON projects;
DROP POLICY IF EXISTS "projects_update"     ON projects;
DROP POLICY IF EXISTS "projects_delete"     ON projects;

-- project_images
DROP POLICY IF EXISTS "project_images_all"    ON project_images;
DROP POLICY IF EXISTS "project_images_select" ON project_images;
DROP POLICY IF EXISTS "project_images_insert" ON project_images;
DROP POLICY IF EXISTS "project_images_update" ON project_images;
DROP POLICY IF EXISTS "project_images_delete" ON project_images;

-- surveys
DROP POLICY IF EXISTS "surveys_all"    ON surveys;
DROP POLICY IF EXISTS "surveys_select" ON surveys;
DROP POLICY IF EXISTS "surveys_insert" ON surveys;
DROP POLICY IF EXISTS "surveys_update" ON surveys;
DROP POLICY IF EXISTS "surveys_delete" ON surveys;

-- monitoring
DROP POLICY IF EXISTS "monitoring_all"    ON monitoring;
DROP POLICY IF EXISTS "monitoring_select" ON monitoring;
DROP POLICY IF EXISTS "monitoring_insert" ON monitoring;
DROP POLICY IF EXISTS "monitoring_update" ON monitoring;
DROP POLICY IF EXISTS "monitoring_delete" ON monitoring;

-- reports
DROP POLICY IF EXISTS "reports_all"    ON reports;
DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_insert" ON reports;
DROP POLICY IF EXISTS "reports_update" ON reports;
DROP POLICY IF EXISTS "reports_delete" ON reports;

-- ── 3. Re-enable RLS on all tables (idempotent) ───────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;

-- ── 4. Recreate policies — all authenticated users share global data ───────

-- profiles: read by any authed user; write only own row
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- projects: full access for any authenticated user
CREATE POLICY "projects_all" ON projects
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- project_images: full access for any authenticated user
CREATE POLICY "project_images_all" ON project_images
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- surveys: full access for any authenticated user
CREATE POLICY "surveys_all" ON surveys
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- monitoring: full access for any authenticated user
CREATE POLICY "monitoring_all" ON monitoring
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- reports: full access for any authenticated user
CREATE POLICY "reports_all" ON reports
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ── 5. Fix storage bucket policies ───────────────────────────────────────

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old storage policies
DROP POLICY IF EXISTS "storage_project_images_read"   ON storage.objects;
DROP POLICY IF EXISTS "storage_project_images_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_project_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_project_images_update" ON storage.objects;

-- Public read (no auth required — images are public)
CREATE POLICY "storage_project_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

-- Authenticated upload
CREATE POLICY "storage_project_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

-- Authenticated update
CREATE POLICY "storage_project_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

-- Authenticated delete
CREATE POLICY "storage_project_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);
