-- Phase 1A: gallery photo storage metadata

ALTER TABLE projects ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

CREATE TABLE gallery_photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename      TEXT        NOT NULL,
  google_drive_file_id TEXT NOT NULL,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_photos_project_id ON gallery_photos(project_id);
CREATE INDEX idx_gallery_photos_sort ON gallery_photos(project_id, sort_order);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_photos_admin_all"
  ON gallery_photos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
