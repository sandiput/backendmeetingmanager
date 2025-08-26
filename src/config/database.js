const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

// Buat fungsi logging yang aman
const sequelizeLogger = (msg) => {
  if (process.env.NODE_ENV === "development") {
    if (typeof logger.debug === "function") {
      logger.debug(msg);
    } else {
      console.log(msg);
    }
  }
};

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "meeting_manager",
  logging: sequelizeLogger,
  timezone: "+07:00", // aman untuk MySQL
  dialectOptions: {
    timezone: "+07:00",
    dateStrings: true,
    typeCast: true,
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

// Initialize database
const initDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  try {
    await sequelize.close();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error closing database connection:", error);
    process.exit(1);
  }
});

module.exports = {
  sequelize,
  testConnection,
  initDatabase,
};
