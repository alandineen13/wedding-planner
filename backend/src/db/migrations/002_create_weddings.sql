CREATE TABLE weddings (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wedding_date  DATE,
  partner_name  TEXT,
  venue_name    TEXT,
  total_budget  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX weddings_user_id_idx ON weddings(user_id);
