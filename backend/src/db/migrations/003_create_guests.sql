CREATE TABLE guests (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id             UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  first_name             TEXT        NOT NULL,
  last_name              TEXT        NOT NULL,
  email                  TEXT,
  phone                  TEXT,
  address                TEXT,
  side                   TEXT        NOT NULL CHECK (side IN ('bride', 'groom', 'both')),
  "group"                TEXT,
  invite_status          TEXT        NOT NULL DEFAULT 'not_sent'
                                     CHECK (invite_status IN ('not_sent', 'sent', 'delivered')),
  rsvp_status            TEXT        NOT NULL DEFAULT 'pending'
                                     CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
  dietary_requirements   TEXT,
  plus_one_allowed       BOOLEAN     NOT NULL DEFAULT FALSE,
  plus_one_name          TEXT,
  plus_one_dietary       TEXT,
  rsvp_token             UUID        NOT NULL DEFAULT gen_random_uuid(),
  rsvp_submitted_at      TIMESTAMPTZ,
  accommodation_required BOOLEAN     DEFAULT FALSE,
  transport_required     BOOLEAN     DEFAULT FALSE,
  song_request           TEXT,
  message                TEXT,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX guests_wedding_id_idx ON guests(wedding_id);
CREATE UNIQUE INDEX guests_rsvp_token_idx ON guests(rsvp_token);
