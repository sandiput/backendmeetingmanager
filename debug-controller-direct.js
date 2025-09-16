const adminController = require('./src/controllers/adminController');

// Mock request and response objects
const mockReq = {
  query: {
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('📊 Controller Response Status:', this.statusCode);
    console.log('📊 Controller Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data.admins.length > 0) {
      const firstAdmin = data.data.admins[0];
      console.log('\n🔍 First admin from controller:');
      console.log('- IP Address:', firstAdmin.ip_address);
      console.log('- Last Login:', firstAdmin.last_login);
      console.log('- Last Login At:', firstAdmin.last_login_at);
      console.log('- All fields:', Object.keys(firstAdmin));
      
      if (data.data.admins.length > 1) {
        const secondAdmin = data.data.admins[1];
        console.log('\n🔍 Second admin from controller:');
        console.log('- Username:', secondAdmin.username);
        console.log('- IP Address:', secondAdmin.ip_address);
        console.log('- Last Login:', secondAdmin.last_login);
        console.log('- Last Login At:', secondAdmin.last_login_at);
      }
    }
    return this;
  }
};

const mockNext = function(error) {
  if (error) {
    console.error('❌ Controller Error:', error.message);
  }
};

async function testController() {
  try {
    console.log('🔍 Testing adminController.getAllAdmins directly...\n');
    await adminController.getAllAdmins(mockReq, mockRes, mockNext);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testController();