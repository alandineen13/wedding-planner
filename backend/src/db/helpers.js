function toCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function mapRow(row) {
  if (!row) return null;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [toCamel(k), v])
  );
}

function mapGuest(row) {
  if (!row) return null;
  const g = mapRow(row);
  g.plusOne = g.plusOneName
    ? { name: g.plusOneName, dietaryRequirements: g.plusOneDietary || undefined }
    : undefined;
  delete g.plusOneName;
  delete g.plusOneDietary;
  delete g.weddingId;
  return g;
}

function mapTable(row) {
  if (!row) return null;
  const t = mapRow(row);
  t.guestIds = Array.isArray(t.guestIds) ? t.guestIds : [];
  delete t.weddingId;
  return t;
}

// Wraps async route handlers so errors are forwarded to Express error handler
const asyncHandler = fn => (req, res, next) => fn(req, res, next).catch(next);

module.exports = { mapRow, mapGuest, mapTable, asyncHandler };
