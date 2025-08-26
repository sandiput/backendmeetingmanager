const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Security middleware setup
const setupSecurity = (app) => {
  // Enable CORS
  app.use(cors(corsOptions));

  // Basic security headers
  app.use(helmet());

  // Rate limiting
  app.use('/api/', limiter);

  // Parse JSON bodies
  app.use(express.json());

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));

  // Custom security middleware
  app.use((req, res, next) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  });
};

module.exports = setupSecurity;