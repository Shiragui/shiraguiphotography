-- Signature data, client date, and PDF storage for contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS client_date      TEXT,
  ADD COLUMN IF NOT EXISTS signature_image  TEXT,  -- base64 PNG data URL
  ADD COLUMN IF NOT EXISTS signature_type   TEXT CHECK (signature_type IN ('drawn', 'typed')),
  ADD COLUMN IF NOT EXISTS pdf_drive_id     TEXT;

-- Fix turnaround in the default template: 1–3 weeks → 1–2 weeks
UPDATE contract_templates
SET body       = REPLACE(body, '1–3 weeks', '1–2 weeks'),
    updated_at = NOW()
WHERE is_default = true;
