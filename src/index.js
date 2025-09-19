require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./config/database");
const cron = require("node-cron");
const ScheduledJobs = require("./jobs/scheduledJobs");
const WhatsAppScheduler = require("./jobs/whatsappScheduler");
const { auditLogger } = require("./middleware/auditLogger");
const { checkAdminAuthStatus } = require("./middleware/auth");

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://10.102.234.158",
  "http://10.102.234.158:8080",
  "http://10.102.234.158:5173",
  "http://10.102.234.158:3000",
];

// Add additional origins from environment variable if specified
if (process.env.ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
  allowedOrigins.push(...additionalOrigins);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        console.log(`✅ Allowed origins: ${allowedOrigins.join(", ")}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);
app.use(express.json());
app.use(cookieParser());

// Check admin auth status for all requests (optional auth)
app.use(checkAdminAuthStatus);

// Audit logging middleware (must be after auth middleware)
app.use(auditLogger);

// Serve static files for uploads
app.use("/uploads", express.static("uploads"));

// Database connection
sequelize
  .authenticate()
  .then(() => console.log("📦 Connected to MySQL database"))
  .catch((err) => console.error("❌ Database connection error:", err));

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Meeting Manager API is running" });
});

// API Routes
app.use("/api", require("./routes/api"));
app.use("/api/whatsapp", require("./routes/whatsapp"));
app.use("/api/attachments", require("./routes/attachments"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Initialize scheduled jobs
  ScheduledJobs.initializeJobs();

  // Initialize WhatsApp scheduler
  const whatsappScheduler = new WhatsAppScheduler();
  await whatsappScheduler.initializeJobs();

  // Make scheduler globally accessible
  global.whatsappScheduler = whatsappScheduler;

  // Auto-initialize WhatsApp service if session exists
  try {
    const whatsappService = require("./services/whatsappService");
    console.log("🔄 Auto-initializing WhatsApp service...");
    const result = await whatsappService.initialize();
    if (result.success) {
      console.log("✅ WhatsApp service auto-initialized successfully");
    } else {
      console.log("⚠️ WhatsApp service initialization skipped:", result.message);
    }
  } catch (error) {
    console.error("❌ WhatsApp service auto-initialization failed:", error.message);
  }
});
