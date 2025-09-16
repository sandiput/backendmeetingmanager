const express = require('express');
const cookieParser = require('cookie-parser');
const { authenticateAdmin } = require('./src/middleware/auth');
const adminController = require('./src/controllers/adminController');

const app = express();
app.use(cookieParser());

// Mock request with cookie
const mockReq = {
  cookies: {
    admin_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiOGExYWQyYWEtMDUzMy00ZGM0LTgxMGYtYWJiNzNmYWQzODgxIiwiaWF0IjoxNzU4MDEzMzA3LCJleHAiOjE3NTgwOTk3MDd9.1ya0bsL5X8kKtKPXTAgKgLgNcMyxOWPtripU5JxNF0'
  },
  query: {
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
};

let responseData = null;
let responseStatus = null;

const mockRes = {
  status: function(code) {
    responseStatus = code;
    return this;
  },
  json: function(data) {
    responseData = data;
    console.log('📊 Final Response Status:', responseStatus);
    console.log('📊 Final Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data.admins.length > 0) {
      const firstAdmin = data.data.admins[0];
      console.log('\n🔍 First admin in final response:');
      console.log('- IP Address:', firstAdmin.ip_address);
      console.log('- Last Login:', firstAdmin.last_login);
      console.log('- Last Login At:', firstAdmin.last_login_at);
      console.log('- All fields:', Object.keys(firstAdmin));
    }
    return this;
  }
};

const mockNext = function(error) {
  if (error) {
    console.error('❌ Middleware Error:', error.message);
  } else {
    console.log('✅ Middleware passed, calling controller...');
    // Call controller after middleware
    adminController.getAllAdmins(mockReq, mockRes, mockNext);
  }
};

async function testMiddlewareChain() {
  try {
    console.log('🔍 Testing middleware chain...\n');
    await authenticateAdmin(mockReq, mockRes, mockNext);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMiddlewareChain();