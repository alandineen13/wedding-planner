ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS rsvp_code TEXT UNIQUE;

-- Generate a deterministic code for any existing wedding rows
UPDATE weddings
SET rsvp_code = substring(md5(id::text), 1, 10)
WHERE rsvp_code IS NULL;
