const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const caseRoutes = require('./routes/caseRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const caseAssignmentRoutes = require('./routes/caseAssignmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { router: messageRoutes } = require('./routes/simpleMessageRoutes');
const imageAnalysisRoutes = require('./routes/imageAnalysis');

const app = express();

// Middleware
app.use(express.json());

// Dynamic CORS: allow frontend URL from env + localhost fallbacks
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, Postman, mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Audited Routes
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analyze', imageAnalysisRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/case-assignments', caseAssignmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Forensic Writer API is running...');
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
