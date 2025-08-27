const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Pastikan direktori log ada
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Path file log SQL
const sqlLogFile = path.join(logDir, 'sql.log');

/**
 * Logger untuk SQL statement
 * @param {string} sql - SQL statement yang dieksekusi
 */
const sqlLogger = (sql) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = `[${timestamp}] ${sql}\n`;
  
  // Tulis ke file log
  fs.appendFileSync(sqlLogFile, logEntry);
  
  // Juga tampilkan di console jika dalam mode development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SQL] ${sql}`);
  }
};

module.exports = sqlLogger;