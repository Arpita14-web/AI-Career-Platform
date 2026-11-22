const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration - Allow all localhost ports
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all localhost origins and common development ports
        const allowedOrigins = [
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/
        ];
        
        // Check if the origin matches any allowed pattern
        const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/career-platform', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();

// ========== DEBUG MIDDLEWARE ==========
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`, req.body);
    next();
});

// ========== ROUTE SETUP WITH ERROR HANDLING ==========
console.log('🔄 Setting up routes...');

// Test route - should always work
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '✅ API is working!',
        cors: 'CORS is enabled for all localhost ports',
        timestamp: new Date().toISOString()
    });
});

// Debug route to check all routes
app.get('/api/debug-routes', (req, res) => {
    console.log('🔍 Debug routes endpoint hit');
    res.json({
        success: true,
        message: 'Debug routes endpoint is working!',
        availableRoutes: [
            { method: 'GET', path: '/api/test', description: 'Basic API test' },
            { method: 'GET', path: '/api/debug-routes', description: 'This debug endpoint' },
            { method: 'POST', path: '/api/jobs', description: 'Create job posting' },
            { method: 'GET', path: '/api/jobs', description: 'Get all jobs' }
        ],
        serverInfo: {
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        }
    });
});

// Try to load and mount routes with error handling
try {
    console.log('🔄 Loading auth routes...');
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes mounted');
} catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
}

try {
    console.log('🔄 Loading profile routes...');
    const profileRoutes = require('./routes/profile');
    app.use('/api/profile', profileRoutes);
    console.log('✅ Profile routes mounted');
} catch (error) {
    console.error('❌ Failed to load profile routes:', error.message);
}

try {
    console.log('🔄 Loading job routes...');
    const jobRoutes = require('./routes/job');
    app.use('/api/jobs', jobRoutes);
    console.log('✅ Job routes mounted');
} catch (error) {
    console.error('❌ Failed to load job routes:', error.message);
    
    // Create a temporary job route if the file doesn't exist
    app.post('/api/jobs', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Temporary job route - file not found but endpoint works',
            data: req.body
        });
    });
    console.log('✅ Temporary job route created');
}

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'uploads/resumes';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 AI Career Platform Backend',
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

// ========== ERROR HANDLING ==========
// 404 handler - should come after all routes
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            '/api/test',
            '/api/debug-routes', 
            '/api/auth/*',
            '/api/profile/*',
            '/api/jobs/*'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Global error handler:', err.stack);
    
    // Handle CORS errors
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Test URL: http://localhost:${PORT}/api/test`);
    console.log(`🔗 Debug URL: http://localhost:${PORT}/api/debug-routes`);
    console.log('='.repeat(50));
});