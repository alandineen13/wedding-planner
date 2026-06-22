CREATE TABLE suppliers (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID          NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name             TEXT          NOT NULL,
  category         TEXT          NOT NULL
                                 CHECK (category IN ('venue','catering','photography','videography',
                                   'florist','entertainment','attire','hair_makeup','cake',
                                   'transport','accommodation','other')),
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,
  website          TEXT,
  address          TEXT,
  contract_status  TEXT          NOT NULL DEFAULT 'none'
                                 CHECK (contract_status IN ('none', 'pending', 'signed')),
  contract_url     TEXT,
  total_cost       NUMERIC(12,2),
  deposit_amount   NUMERIC(12,2),
  deposit_paid     BOOLEAN       DEFAULT FALSE,
  balance_due      NUMERIC(12,2),
  balance_due_date DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX suppliers_wedding_id_idx ON suppliers(wedding_id);
