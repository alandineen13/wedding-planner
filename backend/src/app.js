const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const guestRoutes = require('./routes/guests');
const rsvpRoutes = require('./routes/rsvp');
const weddingRsvpRoutes = require('./routes/weddingRsvp');
const tableRoutes = require('./routes/tables');
const budgetRoutes = require('./routes/budget');
const supplierRoutes = require('./routes/suppliers');
const taskRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/wedding-rsvp', weddingRsvpRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/tasks', taskRoutes);

app.use(errorHandler);

module.exports = app;
