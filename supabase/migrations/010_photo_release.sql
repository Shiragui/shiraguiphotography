-- Add photo_release opt-in to contracts
-- NULL = not yet signed, TRUE = opted in, FALSE = opted out
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS photo_release BOOLEAN;
