ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS gallery_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_projects_gallery_token ON projects(gallery_token);
