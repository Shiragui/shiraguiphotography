CREATE TABLE IF NOT EXISTS client_emails (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  UUID        REFERENCES inquiries(id) ON DELETE SET NULL,
  client_id   UUID        REFERENCES clients(id)   ON DELETE SET NULL,
  project_id  UUID        REFERENCES projects(id)  ON DELETE SET NULL,
  to_email    TEXT        NOT NULL,
  subject     TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE client_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON client_emails FOR ALL USING (is_admin());

CREATE INDEX idx_client_emails_inquiry_id ON client_emails(inquiry_id);
CREATE INDEX idx_client_emails_client_id  ON client_emails(client_id);
CREATE INDEX idx_client_emails_sent_at    ON client_emails(sent_at DESC);
