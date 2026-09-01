-- Add late arrival clause: session ends at agreed time regardless of when client arrives.
UPDATE contract_templates
SET body = REPLACE(
  body,
  'A 10-minute grace period applies to full sessions. If Client has not arrived within 10 minutes of the session start time, the session fee is forfeited. There is no grace period for mini sessions, which are booked back-to-back.',
  'A 10-minute grace period applies to full sessions. If Client has not arrived within 10 minutes of the session start time, the session fee is forfeited. There is no grace period for mini sessions, which are booked back-to-back.

Regardless of arrival time, the session will conclude at the originally agreed end time. Late arrival does not entitle Client to additional session time.'
),
updated_at = NOW()
WHERE is_default = true;
