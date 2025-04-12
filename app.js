// app.js - Main application file

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// MongoDB connection
const MONGO_URI = ''; // Change as needed

mongoose.connect(MONGO_URI, {
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
  app.locals.db = mongoose; // ✅ Attach Mongoose to app.locals
});

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Change this to your frontend domain in production
    methods: ["GET", "POST"]
  }
});

// Online users map: userId -> { socketId, role }
const onlineUsers = {};
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Socket event handlers
require('./sockets')(io, onlineUsers);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Home route
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user || null });
});

// Routers
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const technicianRouter = require('./routes/technician');
const customerRouter = require('./routes/customer');
const { router: technicianaiRouter } = require('./routes/ai');

app.use('/', authRouter);
app.use('/admin', adminRouter);
app.use('/technician', technicianRouter);
app.use('/customer', customerRouter);
app.use('/ai', technicianaiRouter);

// Services route
const services = [
  { id: 1, name: "Device Installation", description: "Installation of electronic and home appliances." },
  { id: 2, name: "Maintenance", description: "General home and office maintenance solutions." },
  { id: 3, name: "Mechanic Services", description: "Vehicle and machinery repair specialists." },
  { id: 4, name: "Electrical Work", description: "Certified electricians for wiring and appliance fixes." },
  { id: 5, name: "Gardening", description: "Lawn maintenance, landscaping, and plant care." },
  { id: 6, name: "Cleaning", description: "Professional home and office cleaning services." },
  { id: 7, name: "Plumbing", description: "Expert plumbers for installations and repairs." },
];

app.get('/services', (req, res) => {
  res.render('services', { services });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start server
const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
