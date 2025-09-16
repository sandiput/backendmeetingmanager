const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', apiRoutes);

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`🚀 Debug server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET /api/admins');
  console.log('\n🔍 Test with:');
  console.log(`  curl -X GET "http://localhost:${PORT}/api/admins" \\`);
  console.log('    -H "Cookie: admin_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiOGExYWQyYWEtMDUzMy00ZGM0LTgxMGYtYWJiNzNmYWQzODgxIiwiaWF0IjoxNzU4MDEzMzA3LCJleHAiOjE3NTgwOTk3MDd9.1ya0bsL5X8kKtKPXTAgKgLgNcMyxOWPtripU5JxNF0"');
});