const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');
const { initializeSocket } = require('./config/socket');

dotenv.config({ path: path.join(__dirname, '../../.env') });

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Initialize Socket.IO
const io = initializeSocket(server);
console.log('Socket.IO initialized for real-time notifications');

// Make io instance available to routes
app.set('io', io);
