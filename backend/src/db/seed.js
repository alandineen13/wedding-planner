require('dotenv').config();
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('./client');

const DEMO_EMAIL    = 'demo@weddingplanner.com';
const DEMO_PASSWORD = 'Demo1234!';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotent — skip if demo already exists
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]
    );
    if (existing.length > 0) {
      console.log('Demo account already exists — run with --reset to recreate it.');
      console.log(`  Email:    ${DEMO_EMAIL}`);
      console.log(`  Password: ${DEMO_PASSWORD}`);
      await client.query('ROLLBACK');
      return;
    }

    // ── User ───────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
      [DEMO_EMAIL, passwordHash, "Sarah O'Brien"]
    );

    // ── Wedding ────────────────────────────────────────────────────────────
    const { rows: [wedding] } = await client.query(
      `INSERT INTO weddings (user_id, partner_name, wedding_date, venue_name, total_budget)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user.id, 'James Murphy', '2027-06-12', 'Dromoland Castle, Co. Clare', 28000]
    );
    const wid = wedding.id;

    // ── Guests ─────────────────────────────────────────────────────────────
    const guestDefs = [
      // Confirmed
      { first: "Mary",      last: "O'Brien",    email: "mary.obrien@example.com",     status: 'confirmed', side: 'bride', group: 'Family',  plusAllowed: false, dietary: 'Gluten free' },
      { first: "Patrick",   last: "O'Brien",    email: "patrick.obrien@example.com",   status: 'confirmed', side: 'bride', group: 'Family',  plusAllowed: false },
      { first: "Aoife",     last: "O'Brien",    email: "aoife.obrien@example.com",     status: 'confirmed', side: 'bride', group: 'Family',  plusAllowed: true,  plusName: 'Mark Connelly' },
      { first: "Niamh",     last: "Walsh",      email: "niamh.walsh@example.com",      status: 'confirmed', side: 'bride', group: 'Friends', plusAllowed: true,  plusName: 'Cian Walsh', plusDietary: 'Vegetarian' },
      { first: "Saoirse",   last: "Ryan",       email: "saoirse.ryan@example.com",     status: 'confirmed', side: 'bride', group: 'Family',  plusAllowed: false },
      { first: "Catherine", last: "Murphy",     email: "catherine.murphy@example.com", status: 'confirmed', side: 'groom', group: 'Family',  plusAllowed: false },
      { first: "Thomas",    last: "Murphy",     email: "thomas.murphy@example.com",    status: 'confirmed', side: 'groom', group: 'Family',  plusAllowed: false, dietary: 'Nut allergy' },
      { first: "Conor",     last: "Murphy",     email: "conor.murphy@example.com",     status: 'confirmed', side: 'groom', group: 'Family',  plusAllowed: true,  plusName: 'Rachel Murphy' },
      { first: "Liam",      last: "Brennan",    email: "liam.brennan@example.com",     status: 'confirmed', side: 'groom', group: 'Friends', plusAllowed: true,  plusName: 'Orla Brennan', plusDietary: 'Vegan' },
      { first: "David",     last: "Chen",       email: "david.chen@example.com",       status: 'confirmed', side: 'both',  group: 'Friends', plusAllowed: true,  plusName: 'Sophie Chen' },
      // Pending
      { first: "Ciarán",    last: "O'Brien",    email: "ciaran.obrien@example.com",    status: 'pending',   side: 'bride', group: 'Family',  plusAllowed: true },
      { first: "Fionnuala", last: "Ryan",       email: "fionnuala.ryan@example.com",   status: 'pending',   side: 'bride', group: 'Family',  plusAllowed: false },
      { first: "Emma",      last: "Murphy",     email: "emma.murphy@example.com",      status: 'pending',   side: 'groom', group: 'Family',  plusAllowed: false },
      { first: "Declan",    last: "Fitzpatrick",email: "declan.fitz@example.com",      status: 'pending',   side: 'groom', group: 'Friends', plusAllowed: true },
      { first: "Michael",   last: "Burke",      email: "michael.burke@example.com",    status: 'pending',   side: 'both',  group: 'Friends', plusAllowed: true },
      { first: "Hannah",    last: "Burke",      email: "hannah.burke@example.com",     status: 'pending',   side: 'both',  group: 'Friends', plusAllowed: false },
      // Maybe
      { first: "Jack",      last: "O'Sullivan", email: "jack.osullivan@example.com",   status: 'maybe',     side: 'groom', group: 'Friends', plusAllowed: true },
      { first: "Grace",     last: "Kelly",      email: "grace.kelly@example.com",      status: 'maybe',     side: 'bride', group: 'Friends', plusAllowed: false },
      // Declined
      { first: "Séamus",    last: "Ryan",       email: "seamus.ryan@example.com",      status: 'declined',  side: 'bride', group: 'Family',  plusAllowed: false },
      { first: "Brigid",    last: "Connolly",   email: "brigid.connolly@example.com",  status: 'declined',  side: 'groom', group: 'Friends', plusAllowed: false },
    ];

    const insertedGuests = [];
    for (const g of guestDefs) {
      const { rows: [row] } = await client.query(
        `INSERT INTO guests
           (wedding_id, first_name, last_name, email, rsvp_status, side, "group",
            plus_one_allowed, plus_one_name, plus_one_dietary, dietary_requirements, rsvp_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [wid, g.first, g.last, g.email, g.status, g.side, g.group,
         g.plusAllowed ?? false, g.plusName ?? null, g.plusDietary ?? null,
         g.dietary ?? null, randomUUID()]
      );
      insertedGuests.push({ id: row.id, status: g.status });
    }

    // ── Seating tables ─────────────────────────────────────────────────────
    const tableDefs = [
      { name: 'Top Table',  capacity: 8,  shape: 'rectangular', notes: 'Bridal party & parents' },
      { name: 'Table 1',    capacity: 10, shape: 'round',        notes: "Bride's family" },
      { name: 'Table 2',    capacity: 10, shape: 'round',        notes: "Groom's family" },
      { name: 'Table 3',    capacity: 8,  shape: 'round',        notes: 'Friends' },
    ];
    const tableIds = [];
    for (const t of tableDefs) {
      const { rows: [row] } = await client.query(
        `INSERT INTO tables (wedding_id, name, capacity, shape, notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [wid, t.name, t.capacity, t.shape, t.notes]
      );
      tableIds.push(row.id);
    }

    // Assign confirmed guests across tables (indices match guestDefs order above)
    const confirmed = insertedGuests.filter(g => g.status === 'confirmed').map(g => g.id);
    // confirmed[0]=Mary [1]=Patrick [2]=Aoife [3]=Niamh [4]=Saoirse
    // confirmed[5]=Catherine [6]=Thomas [7]=Conor [8]=Liam [9]=David
    const assignments = [
      [tableIds[0], confirmed[0]],  // Top Table: Mary
      [tableIds[0], confirmed[1]],  // Top Table: Patrick
      [tableIds[0], confirmed[5]],  // Top Table: Catherine
      [tableIds[0], confirmed[6]],  // Top Table: Thomas
      [tableIds[1], confirmed[2]],  // Table 1: Aoife
      [tableIds[1], confirmed[3]],  // Table 1: Niamh
      [tableIds[1], confirmed[4]],  // Table 1: Saoirse
      [tableIds[2], confirmed[7]],  // Table 2: Conor
      [tableIds[2], confirmed[8]],  // Table 2: Liam
      [tableIds[3], confirmed[9]],  // Table 3: David
    ];
    for (const [tid, gid] of assignments) {
      await client.query(
        `INSERT INTO seating_assignments (table_id, guest_id) VALUES ($1,$2)`,
        [tid, gid]
      );
    }

    // ── Suppliers ──────────────────────────────────────────────────────────
    const supplierDefs = [
      { name: 'Dromoland Castle',        category: 'venue',         contact: 'Siobhán O\'Donoghue', email: 'events@dromoland.ie',    phone: '+353 61 368144',    contract: 'signed',   cost: 8500, deposit: 2000, depositPaid: true,  notes: 'Exclusive use on the day. Check-in 3pm Friday.' },
      { name: 'Bites & Delights',        category: 'catering',      contact: 'Paul Regan',           email: 'paul@bites.ie',          phone: '+353 87 123 4567',  contract: 'signed',   cost: 6200, deposit: 1500, depositPaid: true,  notes: '120 covers. 3-course meal. Canapes during reception.' },
      { name: 'Mark Healy Photography',  category: 'photography',   contact: 'Mark Healy',           email: 'mark@mhphoto.ie',        phone: '+353 86 987 6543',  contract: 'signed',   cost: 2800, deposit:  500, depositPaid: true,  notes: 'Full day coverage. Engagement shoot included.' },
      { name: 'Bloom Florals',           category: 'florist',       contact: 'Claire Doyle',         email: 'claire@bloomflorals.ie', phone: '+353 85 234 5678',  contract: 'pending',  cost: 1800,                                    notes: 'Centrepieces, bridal bouquet, buttonholes.' },
      { name: "DJ Kevin O'Brien",        category: 'entertainment', contact: 'Kevin O\'Brien',       email: 'kevin@djkevin.ie',       phone: '+353 87 345 6789',  contract: 'signed',   cost: 1200, deposit:  300, depositPaid: true,  notes: '6 hours. First dance: Perfect — Ed Sheeran.' },
      { name: 'Sweet Dreams Bakery',     category: 'cake',          contact: 'Áine Byrne',           email: 'aine@sweetdreams.ie',    phone: '+353 1 234 5678',   contract: 'none',     cost:  750,                                    notes: '3-tier. Lemon, chocolate, vanilla. Floral decoration.' },
    ];
    for (const s of supplierDefs) {
      await client.query(
        `INSERT INTO suppliers
           (wedding_id, name, category, contact_name, email, phone,
            contract_status, total_cost, deposit_amount, deposit_paid, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [wid, s.name, s.category, s.contact ?? null, s.email ?? null, s.phone ?? null,
         s.contract, s.cost ?? null, s.deposit ?? null, s.depositPaid ?? false, s.notes ?? null]
      );
    }

    // ── Budget items ───────────────────────────────────────────────────────
    const budgetDefs = [
      { name: 'Venue Hire',               category: 'venue',         est: 8000, actual: 8500,  status: 'paid' },
      { name: 'Catering',                 category: 'catering',      est: 6000, actual: 6200,  status: 'deposit_paid' },
      { name: 'Photography',              category: 'photography',   est: 2500, actual: 2800,  status: 'deposit_paid' },
      { name: 'Flowers & Décor',          category: 'flowers',       est: 1800,                status: 'unpaid' },
      { name: 'DJ / Entertainment',       category: 'entertainment', est: 1200, actual: 1200,  status: 'deposit_paid' },
      { name: 'Wedding Cake',             category: 'cake',          est:  800,                status: 'unpaid' },
      { name: 'Wedding Dress & Attire',   category: 'attire',        est: 2500, actual: 2700,  status: 'deposit_paid' },
      { name: 'Transport',                category: 'transport',     est:  600,                status: 'unpaid' },
      { name: 'Hair & Makeup',            category: 'hair_makeup',   est:  700,                status: 'unpaid' },
      { name: 'Invitations & Stationery', category: 'stationery',    est:  350, actual:  320,  status: 'paid' },
      { name: 'Honeymoon',                category: 'honeymoon',     est: 4000,                status: 'unpaid' },
    ];
    for (const b of budgetDefs) {
      await client.query(
        `INSERT INTO budget_items
           (wedding_id, name, category, estimated_cost, actual_cost, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [wid, b.name, b.category, b.est, b.actual ?? null, b.status]
      );
    }

    // ── Tasks ──────────────────────────────────────────────────────────────
    const taskDefs = [
      { title: 'Book the venue',               category: 'venue',         status: 'completed',  priority: 'urgent', due: '2026-01-15', desc: 'Confirm availability and pay deposit' },
      { title: 'Send save the dates',          category: 'invitations',   status: 'completed',  priority: 'high',   due: '2026-03-01', desc: 'Email save the dates to all guests' },
      { title: 'Book photographer',            category: 'photography',   status: 'completed',  priority: 'high',   due: '2026-04-01', desc: 'Sign contract with Mark Healy Photography' },
      { title: 'Order wedding dress',          category: 'attire',        status: 'in_progress',priority: 'urgent', due: '2026-08-01', desc: 'Final fitting scheduled for August' },
      { title: 'Create seating plan',          category: 'other',         status: 'in_progress',priority: 'high',   due: '2027-05-01', desc: 'Assign all confirmed guests to tables' },
      { title: 'Send formal invitations',      category: 'invitations',   status: 'todo',       priority: 'high',   due: '2026-09-01', desc: 'Post invitations with RSVP deadline of 1st November' },
      { title: 'Finalise flower arrangements', category: 'flowers',       status: 'todo',       priority: 'medium', due: '2026-12-01', desc: 'Confirm centrepiece designs with Bloom Florals' },
      { title: 'Book honeymoon',               category: 'accommodation', status: 'todo',       priority: 'medium', due: '2026-10-01', desc: 'Santorini — check Sunvil & Kuoni packages' },
      { title: 'Block-book guest hotel rooms', category: 'accommodation', status: 'todo',       priority: 'medium', due: '2026-11-01', desc: 'Nearby hotel rooms for out-of-town guests' },
      { title: 'Order wedding cake',           category: 'other',         status: 'todo',       priority: 'low',    due: '2027-01-15', desc: 'Confirm design and flavours with Sweet Dreams Bakery' },
      { title: 'Arrange wedding transport',    category: 'transport',     status: 'todo',       priority: 'medium', due: '2027-02-01', desc: 'Vintage car for bride, minibus for guests' },
      { title: 'Plan rehearsal dinner',        category: 'catering',      status: 'todo',       priority: 'low',    due: '2027-04-15', desc: 'Evening before — family and bridal party' },
    ];
    for (const t of taskDefs) {
      await client.query(
        `INSERT INTO tasks (wedding_id, title, category, status, priority, due_date, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [wid, t.title, t.category, t.status, t.priority, t.due ?? null, t.desc ?? null]
      );
    }

    await client.query('COMMIT');

    console.log('\n✅ Demo account seeded successfully!\n');
    console.log(`  Email:    ${DEMO_EMAIL}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    console.log(`\n  Wedding:  Sarah O'Brien & James Murphy`);
    console.log(`  Date:     12 June 2027 — Dromoland Castle, Co. Clare`);
    console.log(`  Budget:   €28,000`);
    console.log(`\n  ${guestDefs.length} guests  •  ${tableDefs.length} tables  •  ${assignments.length} seating assignments`);
    console.log(`  ${supplierDefs.length} suppliers  •  ${budgetDefs.length} budget items  •  ${taskDefs.length} tasks\n`);

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
