CREATE TABLE tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  category    TEXT        NOT NULL
                          CHECK (category IN ('venue','catering','invitations','attire','photography',
                            'entertainment','flowers','transport','accommodation','legal','budget','other')),
  status      TEXT        NOT NULL DEFAULT 'todo'
                          CHECK (status IN ('todo','in_progress','completed','cancelled')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','urgent')),
  due_date    DATE,
  completed_at TIMESTAMPTZ,
  assigned_to TEXT,
  supplier_id UUID        REFERENCES suppliers(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tasks_wedding_id_idx ON tasks(wedding_id);
