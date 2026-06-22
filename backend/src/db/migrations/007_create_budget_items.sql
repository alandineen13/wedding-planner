CREATE TABLE budget_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id     UUID          NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name           TEXT          NOT NULL,
  category       TEXT          NOT NULL
                               CHECK (category IN ('venue','catering','photography','videography',
                                 'flowers','entertainment','attire','accommodation','transport',
                                 'stationery','hair_makeup','cake','rings','honeymoon','other')),
  estimated_cost NUMERIC(12,2) NOT NULL,
  actual_cost    NUMERIC(12,2),
  deposit_amount NUMERIC(12,2),
  deposit_paid   BOOLEAN       DEFAULT FALSE,
  payment_status TEXT          NOT NULL DEFAULT 'unpaid'
                               CHECK (payment_status IN ('unpaid','deposit_paid','partially_paid','paid')),
  supplier_id    UUID          REFERENCES suppliers(id) ON DELETE SET NULL,
  notes          TEXT,
  due_date       DATE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX budget_items_wedding_id_idx ON budget_items(wedding_id);
