const fs = require('fs');
const path = require('path');

// Pastikan direktori logs ada
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'sql.log');

// Fungsi untuk log SQL queries
const sqlLogger = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  // Write to file
  fs.appendFileSync(logFilePath, logEntry, 'utf8');
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`SQL: ${message}`);
  }
};

module.exports = sqlLogger;