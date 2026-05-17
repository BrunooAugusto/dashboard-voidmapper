-- ============================================================
-- Backfill monitoring.project_id from monitoring.project_name
-- Run once in Supabase SQL Editor after deploying this release.
-- ============================================================

-- Step 1: Add project_id column if it doesn't exist yet
ALTER TABLE monitoring
  ADD COLUMN IF NOT EXISTS project_id integer REFERENCES projects(id);

-- Step 2: Fill project_id for rows where project_name matches projects.code exactly
UPDATE monitoring m
SET    project_id = p.id
FROM   projects p
WHERE  m.project_id IS NULL
  AND  m.project_name IS NOT NULL
  AND  p.code = m.project_name;

-- Step 3: Verify result
SELECT
  m.id,
  m.area,
  m.project_name,
  m.project_id,
  p.code AS matched_code
FROM monitoring m
LEFT JOIN projects p ON p.id = m.project_id
ORDER BY m.area;
