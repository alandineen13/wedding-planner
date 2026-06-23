CREATE TABLE seating_assignments (
  table_id   UUID NOT NULL REFERENCES tables(id)  ON DELETE CASCADE,
  guest_id   UUID NOT NULL REFERENCES guests(id)  ON DELETE CASCADE,
  PRIMARY KEY (table_id, guest_id)
);

-- One guest can only sit at one table at a time
CREATE UNIQUE INDEX seating_assignments_guest_idx ON seating_assignments(guest_id);
