-- Contracts feature: contract_templates and contracts tables

CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  sign_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed')),
  signer_name TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER contract_templates_updated_at BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_sign_token ON contracts(sign_token);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_templates_admin_all"
  ON contract_templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contracts_admin_all"
  ON contracts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed the default template
INSERT INTO contract_templates (name, body, is_default) VALUES (
  'Standard Photography Services Contract',
  'PHOTOGRAPHY SERVICES AGREEMENT

This Photography Services Agreement is entered into as of {{date_today}}, between Shira Gui Photography ("Photographer") and {{client_name}} ("Client").

Session Type:  {{project_type}}
Session Date:  {{session_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. SESSION FEES

Full payment is due on or before the session date as agreed upon in writing. All fees are non-refundable. No deposit is required to book; the agreed session fee covers all digital images delivered via the online gallery. Prints and additional products are purchased separately through the gallery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B. LOCATION COSTS & FEES

If there are any costs or fees associated with the location chosen by the Client (permits, parking, entry fees, etc.), the Client is solely responsible for those costs. Photographer will not guarantee or provide payment for a location.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C. RESCHEDULING & CANCELLATION

Client may reschedule their session one time by providing at least 24 hours'' notice prior to the scheduled shoot without penalty. If Client fails to give 24 hours'' notice, or cancels entirely, the session fee is forfeited and will not be refunded.

Photographer reserves the right to reschedule due to illness, severe weather, equipment malfunction, or other circumstances beyond Photographer''s control. In such cases, Client will be offered a full reschedule at no additional cost.

A 10-minute grace period applies to full sessions. If Client has not arrived within 10 minutes of the session start time, the session fee is forfeited. There is no grace period for mini sessions, which are booked back-to-back.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D. IMAGE DELIVERY & TURNAROUND

Photographer will deliver carefully selected, edited digital photographs via a private online gallery within 1–2 weeks of the session date. Turnaround time may vary by season and session type.

Photographer will select which images are included in the final delivery. Images with eyes closed, duplicates, unflattering expressions, or otherwise not meeting Photographer''s quality standard will not be included. No unedited or raw images will be released under any circumstances.

Client will have 30 days from the date the gallery link is delivered to download their photographs. After 30 days, files may no longer be accessible. Photographer is not responsible for long-term storage of files after delivery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E. RE-SHOOTS & REFUNDS

Re-shoots and refunds will not be provided for poor choices of clothing, hair, or makeup; uncooperative subjects; weather-related dissatisfaction; or failure to follow Photographer''s recommendations during the session. Re-shoots are at the sole discretion of the Photographer.

Once all images have been delivered, Photographer''s contractual obligation is fulfilled. Client accepts that images will be consistent with Photographer''s portfolio and editing style as displayed on shiraguiphotography.com.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F. COPYRIGHT & PHOTO RELEASE

Shira Gui Photography retains full copyright to all images created during the session. Client is granted a personal-use license to print, display, and share the delivered photographs for personal, non-commercial purposes.

Client may not sell, license, or use the photographs for commercial or advertising purposes without prior written consent from Photographer.

Regarding use of Client''s photographs for Shira Gui Photography''s portfolio, website, Instagram, and other promotional materials: Client''s preference is captured at the time of signing and noted at the bottom of this agreement. Opting out will not affect the session in any way.

Feel free to take behind-the-scenes photos on your phone during the session; please be respectful in doing so and avoid interfering with the shoot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

G. LIABILITY

Photographer is not responsible for any injuries to Client or accompanying parties during the session. Client is responsible for themselves, their minor children, and any guests, and releases Photographer from any related claims.

Photographer is not responsible for damage to or loss of portraits after delivery to Client. Client assumes full responsibility for the safety of all photographs upon receipt.

Photographer''s total liability under this Agreement shall not exceed the total fees paid by Client.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H. SESSION GUIDELINES

• Please arrive 5–10 minutes before the session start time.
• Please avoid red or orange food and drinks before the session, as they can stain the face.
• Please do not bring children who are not being photographed to the session.
• Creative direction, posing, and editing style are at the Photographer''s discretion and will be consistent with Photographer''s portfolio.

• Creative direction, posing, and editing style are at the Photographer''s discretion and will be consistent with Photographer''s portfolio.',
  true
);
