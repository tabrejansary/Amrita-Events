require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const connectDatabase = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clubRoutes = require('./routes/clubRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const systemRoutes = require('./routes/systemRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const formRoutes = require('./routes/formRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDatabase();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://172.29.8.42:3000',
    'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Data Sanitization against NoSQL Injection
// Custom middleware to sanitize data without conflicting with Express 5
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (const key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key];
                } else {
                    sanitize(obj[key]);
                }
            }
        }
    };

    // Sanitize body and params (which are writable)
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);

    // Handle query separately since it might be read-only in Express 5
    if (req.query) {
        // Create a copy, sanitize it, and try to replace 
        // If we can't replace, at least we don't crash, but strict sanitization for query 
        // might be skipped if we can't write. 
        // However, for NoSQL injection, body is the main vector.
        try {
            // Try the check-and-define approach again just for this
            if (req.query && typeof req.query === 'object') {
                const query = req.query;
                sanitize(query);
            }
        } catch (e) {
            // Ignore if we can't write to query
        }
    }

    next();
});

// Data Sanitization against XSS
// app.use(xss());

// Prevent Parameter Pollution
// app.use(hpp()); // Temporarily disabled due to Express 5 compatibility issues

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/registrations', registrationRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Amrita Events API is running',
        timestamp: new Date().toISOString(),
    });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Amrita Events API',
        version: '1.0.0',
    });
});

// Error handling middleware
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
