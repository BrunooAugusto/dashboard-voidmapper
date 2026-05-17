-- ============================================================
-- VoidMapper — RLS + project_images patch (v2)
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. Fix project_images column (rename "order" → sort_order if needed) ──

ALTER TABLE project_images
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

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

-- ── 2. Drop ALL policies on every table (catches any legacy names) ─────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'projects', 'project_images', 'surveys', 'monitoring', 'reports')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Also drop all storage policies for this bucket
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname ILIKE '%project_image%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

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

-- projects: full access for any authenticated user (no user isolation)
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

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (no auth required — images are public)
CREATE POLICY "storage_project_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

-- Authenticated upload/update/delete
CREATE POLICY "storage_project_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_project_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "storage_project_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

-- ── 6. Verify: list active policies ──────────────────────────────────────

SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'projects', 'project_images', 'surveys', 'monitoring', 'reports')
ORDER BY tablename, policyname;
