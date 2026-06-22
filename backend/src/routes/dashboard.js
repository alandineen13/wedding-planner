const router = require('express').Router();
const pool = require('../db/client');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../db/helpers');

// GET /api/dashboard
router.get('/', auth, asyncHandler(async (req, res) => {
  const wid = req.user.weddingId;

  const [guestRes, budgetRes, taskRes, seatingRes, weddingRes] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE rsvp_status='confirmed')::int      AS confirmed,
        COUNT(*) FILTER (WHERE rsvp_status='declined')::int       AS declined,
        COUNT(*) FILTER (WHERE rsvp_status='pending')::int        AS pending,
        COUNT(*) FILTER (WHERE rsvp_status='maybe')::int          AS maybe,
        COUNT(*) FILTER (WHERE plus_one_name IS NOT NULL)::int    AS plus_ones
      FROM guests WHERE wedding_id=$1
    `, [wid]),

    pool.query(`
      SELECT
        w.total_budget,
        COALESCE(SUM(bi.estimated_cost), 0)                                          AS total_estimated,
        COALESCE(SUM(bi.actual_cost), 0)                                             AS total_actual,
        COALESCE(SUM(bi.actual_cost) FILTER (WHERE bi.payment_status='paid'), 0)     AS total_paid
      FROM weddings w
      LEFT JOIN budget_items bi ON bi.wedding_id = w.id
      WHERE w.id=$1
      GROUP BY w.id, w.total_budget
    `, [wid]),

    pool.query(`
      SELECT
        COUNT(*)::int                                                        AS total,
        COUNT(*) FILTER (WHERE status='completed')::int                     AS completed,
        COUNT(*) FILTER (WHERE status='in_progress')::int                   AS in_progress,
        COUNT(*) FILTER (WHERE status='todo')::int                          AS todo,
        COUNT(*) FILTER (WHERE status!='completed' AND due_date < NOW())::int AS overdue
      FROM tasks WHERE wedding_id=$1
    `, [wid]),

    pool.query(`
      SELECT
        COUNT(DISTINCT t.id)::int          AS total_tables,
        COALESCE(SUM(t.capacity), 0)::int  AS total_seats,
        COUNT(sa.guest_id)::int            AS seated_guests
      FROM tables t
      LEFT JOIN seating_assignments sa ON sa.table_id = t.id
      WHERE t.wedding_id=$1
    `, [wid]),

    pool.query('SELECT wedding_date FROM weddings WHERE id=$1', [wid]),
  ]);

  const g = guestRes.rows[0];
  const b = budgetRes.rows[0] ?? { total_budget: 0, total_estimated: 0, total_actual: 0, total_paid: 0 };
  const t = taskRes.rows[0];
  const s = seatingRes.rows[0];
  const weddingDate = weddingRes.rows[0]?.wedding_date;

  const totalActual = parseFloat(b.total_actual) || 0;
  const totalPaid   = parseFloat(b.total_paid)   || 0;
  const totalBudget = parseFloat(b.total_budget) || 0;

  const daysUntilWedding = weddingDate
    ? Math.ceil((new Date(weddingDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  res.json({
    guestStats: {
      total: g.total, confirmed: g.confirmed, declined: g.declined,
      pending: g.pending, maybe: g.maybe, plusOnes: g.plus_ones,
    },
    budgetSummary: {
      totalBudget,
      totalEstimated: parseFloat(b.total_estimated) || 0,
      totalActual,
      totalPaid,
      totalOutstanding: totalActual - totalPaid,
      variance: totalBudget - totalActual,
    },
    taskStats: {
      total: t.total, completed: t.completed, inProgress: t.in_progress,
      todo: t.todo, overdue: t.overdue,
    },
    seatingStats: {
      totalTables: s.total_tables, totalSeats: s.total_seats,
      seatedGuests: s.seated_guests,
      unseatedSeats: s.total_seats - s.seated_guests,
    },
    daysUntilWedding,
  });
}));

module.exports = router;
