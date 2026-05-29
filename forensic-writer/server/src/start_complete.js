const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🚀 Starting Forensic Writer Complete System...');
console.log('📁 Loading routes...');


try {
    const simpleCaseRoutes = require('./routes/simpleCaseRoutes');
    console.log('✅ Case routes loaded');
} catch (e) {
    console.log('❌ Case routes failed:', e.message);
}

try {
    const simpleEvidenceRoutes = require('./routes/simpleEvidenceRoutes');
    console.log('✅ Evidence routes loaded');
} catch (e) {
    console.log('❌ Evidence routes failed:', e.message);
}

try {
    const simpleReportRoutes = require('./routes/simpleReportRoutes');
    console.log('✅ Report routes loaded');
} catch (e) {
    console.log('❌ Report routes failed:', e.message);
}

try {
    const simpleUserRoutes = require('./routes/simpleUserRoutes');
    console.log('✅ User routes loaded');
} catch (e) {
    console.log('❌ User routes failed:', e.message);
}

try {
    const simpleAiRoutes = require('./routes/simpleAiRoutes');
    console.log('✅ AI routes loaded');
} catch (e) {
    console.log('❌ AI routes failed:', e.message);
}

// Start the app
const app = require('./app');

// Auth routes are handled within app.js

// Add admin routes
try {
    const adminRoutes = require('./routes/adminRoutes');
    app.use('/api/admin', adminRoutes);
    console.log('Admin routes loaded');
} catch (e) {
    console.log('Admin routes failed:', e.message);
}
const http = require('http');
const { Server } = require('socket.io');

const startServer = async () => {
    try {
        // Try MongoDB connection (optional)
        let connectDB;
        try {
            connectDB = require('./config/db');
            await connectDB();
            console.log('✅ MongoDB connected successfully');
        } catch (dbError) {
            console.log('⚠️ MongoDB connection failed, using mock data:', dbError.message);
        }
        
        const PORT = process.env.PORT || 5000;
        
        const server = http.createServer(app);
        
        // Initialize Socket.IO
        const io = new Server(server, {
            cors: {
                origin: "*", // Allow all origins for development
                methods: ["GET", "POST"]
            }
        });

        // Make io accessible to our router
        app.set('io', io);

        io.on('connection', (socket) => {
            console.log('🔌 Socket connected:', socket.id);
            
            socket.on('joinRoom', (roomId) => {
                socket.join(roomId);
                console.log(`👤 Socket ${socket.id} joined room ${roomId}`);
            });

            socket.on('disconnect', () => {
                console.log('🔌 Socket disconnected:', socket.id);
            });
        });
        
        server.listen(PORT, () => {
            console.log(`\n🎉 FORENSIC WRITER SYSTEM READY!`);
            console.log(`🌐 Server: http://localhost:${PORT}`);
            console.log(`🔌 WebSocket Server Running`);
            console.log(`📊 Available Endpoints:`);
            console.log(`    GET /api/users/profile - Get profile`);
            console.log(`   📁 GET /api/cases - Get all cases`);
            console.log(`   📊 GET /api/cases/stats - Dashboard stats`);
            console.log(`   📁 POST /api/cases - Create case`);
            console.log(`   🔍 GET /api/evidence/case/:id - Get evidence`);
            console.log(`   📄 GET /api/reports - Get reports`);
            console.log(`   🤖 POST /api/ai/analyze/:id - AI analysis`);
            console.log(`\n💀 All systems operational. Ready for forensic investigation! 💀\n`);
        });
        
    } catch (error) {
        console.error('❌ Server failed to start:', error.message);
        process.exit(1);
    }
};

startServer();
