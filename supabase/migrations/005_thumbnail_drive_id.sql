ALTER TABLE gallery_photos
  ADD COLUMN IF NOT EXISTS thumbnail_drive_id TEXT;
