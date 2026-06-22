// In-memory store keyed by userId for per-user data isolation.
// Swap each resource array for a real DB collection/table when ready.

const store = {
  users: [],
  guests: {},         // { [userId]: Guest[] }
  tables: {},         // { [userId]: SeatingTable[] }
  budgetItems: {},    // { [userId]: BudgetItem[] }
  budgetSettings: {}, // { [userId]: { totalBudget: number } }
  suppliers: {},      // { [userId]: Supplier[] }
  tasks: {},          // { [userId]: Task[] }
};

function initUser(userId) {
  store.guests[userId] = [];
  store.tables[userId] = [];
  store.budgetItems[userId] = [];
  store.budgetSettings[userId] = { totalBudget: 0 };
  store.suppliers[userId] = [];
  store.tasks[userId] = [];
}

module.exports = { store, initUser };
