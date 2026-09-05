require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Verify a JWT token and return the user doc (or null)
const verifySocketToken = (token) => {
  if (!token) return null;
  try {
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'phuclong_secret_key_123456'
    );
    return decoded.id || decoded._id || null;
  } catch (err) {
    return null;
  }
};

// Socket.io Connection & Room Handling
io.on('connection', (socket) => {
  socket.on('join_admin', async () => {
    // Only allow verified admin users into the admin room, otherwise
    // anyone could listen to every customer order in real time.
    const token = socket.handshake?.auth?.token;
    const userId = token ? verifySocketToken(token) : null;
    if (!userId) return;
    try {
      const User = require('./models/User');
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        socket.join('admin_room');
      }
    } catch (err) {
      console.error('join_admin verification error:', err.message);
    }
  });

  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });
});

// Attach io instance to req for controllers to emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Express Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Phúc Long Milk Tea Real-time API Server is running cleanly!');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start the HTTP server locally. Vercel imports the Express app as a function.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Real-time Server running on port ${PORT}`);
  });
}

module.exports = app;
