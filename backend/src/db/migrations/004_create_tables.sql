CREATE TABLE tables (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID          NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name       TEXT          NOT NULL,
  capacity   INTEGER       NOT NULL CHECK (capacity > 0),
  shape      TEXT          NOT NULL DEFAULT 'round'
                           CHECK (shape IN ('round', 'rectangular', 'oval')),
  position_x NUMERIC,
  position_y NUMERIC,
  notes      TEXT
);

CREATE INDEX tables_wedding_id_idx ON tables(wedding_id);
