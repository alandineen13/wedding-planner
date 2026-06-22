const router = require('express').Router();
const auth = require('../middleware/auth');
const { store } = require('../db/store');

// GET /api/dashboard
router.get('/', auth, (req, res) => {
  const uid = req.user.id;
  const guests = store.guests[uid] ?? [];
  const tables = store.tables[uid] ?? [];
  const items = store.budgetItems[uid] ?? [];
  const tasks = store.tasks[uid] ?? [];
  const { totalBudget = 0 } = store.budgetSettings[uid] ?? {};
  const user = store.users.find(u => u.id === uid);

  const guestStats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvpStatus === 'confirmed').length,
    declined: guests.filter(g => g.rsvpStatus === 'declined').length,
    pending: guests.filter(g => g.rsvpStatus === 'pending').length,
    maybe: guests.filter(g => g.rsvpStatus === 'maybe').length,
    plusOnes: guests.filter(g => g.plusOne).length,
  };

  const totalEstimated = items.reduce((s, i) => s + i.estimatedCost, 0);
  const totalActual = items.reduce((s, i) => s + (i.actualCost ?? 0), 0);
  const totalPaid = items
    .filter(i => i.paymentStatus === 'paid')
    .reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0);
  const budgetSummary = {
    totalBudget,
    totalEstimated,
    totalActual,
    totalPaid,
    totalOutstanding: totalActual - totalPaid,
    variance: totalBudget - totalActual,
  };

  const now = new Date();
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    overdue: tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now).length,
  };

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const seatedGuests = tables.reduce((s, t) => s + t.guestIds.length, 0);
  const seatingStats = {
    totalTables: tables.length,
    totalSeats,
    seatedGuests,
    unseatedSeats: totalSeats - seatedGuests,
  };

  const daysUntilWedding = user?.weddingDate
    ? Math.ceil((new Date(user.weddingDate) - now) / (1000 * 60 * 60 * 24))
    : null;

  res.json({ guestStats, budgetSummary, taskStats, seatingStats, daysUntilWedding });
});

module.exports = router;
