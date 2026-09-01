-- Update Section A (SESSION FEES) to reflect deposit model:
-- deposit locks in the date, refundable only for weather/photographer fault,
-- remaining balance paid immediately after the shoot.
UPDATE contract_templates
SET body = REPLACE(
  body,
  'A. SESSION FEES

Full payment is due on or before the session date as agreed upon in writing. All fees are non-refundable. No deposit is required to book; the agreed session fee covers all digital images delivered via the online gallery. Prints and additional products are purchased separately through the gallery.',
  'A. SESSION FEES

A deposit is required to reserve and lock in the session date. The deposit amount will be agreed upon in writing prior to booking.

The deposit is refundable only in the following circumstances: (1) unsafe or severe weather conditions on the day of the session make it impossible to proceed, or (2) the Photographer is unable to complete or deliver the photographs due to unforeseen circumstances beyond Photographer''s control (such as illness or equipment failure). The deposit is non-refundable for any other reason, including Client cancellation or no-show.

The remaining balance is due in full immediately following the photoshoot. No digital images will be delivered until payment has been received in full. All fees beyond the deposit are non-refundable once the session has taken place. The agreed session fee covers all digital images delivered via the online gallery. Prints and additional products are purchased separately through the gallery.'
),
updated_at = NOW()
WHERE is_default = true;
