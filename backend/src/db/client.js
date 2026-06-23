const pg = require('pg');
const { Pool } = pg;

// Return NUMERIC columns as JS numbers, not strings
pg.types.setTypeParser(1700, val => parseFloat(val));
// Return DATE columns as 'YYYY-MM-DD' strings, not Date objects
pg.types.setTypeParser(1082, val => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

module.exports = pool;
