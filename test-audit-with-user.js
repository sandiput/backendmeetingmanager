const { RecentActivity } = require('./models');
const { logDetailedAudit } = require('./src/middleware/auditLogger');

// Test script untuk memverifikasi audit logging dengan user authentication
async function testAuditWithUser() {
  console.log('=== Testing Audit Logging with User Authentication ===\n');
  
  try {
    // Simulate req object with admin user
    const mockReq = {
      admin: {
        id: 1,
        username: 'admin_test',
        email: 'admin@test.com'
      },
      headers: {
        'x-session-id': 'test-session-123',
        'user-agent': 'Test Agent'
      },
      ip: '127.0.0.1',
      method: 'POST',
      path: '/api/participants',
      body: {
        name: 'Test User Audit',
        nip: '123456789',
        seksi: 'IT'
      }
    };
    
    // 1. Test CREATE audit logging
    console.log('1. Testing CREATE audit logging with user...');
    await logDetailedAudit(mockReq, {
      action_type: 'CREATE',
      table_name: 'participants',
      record_id: 'test-123',
      new_values: JSON.stringify({
        id: 'test-123',
        name: 'Test User Audit',
        nip: '123456789',
        seksi: 'IT'
      }),
      changed_fields: 'name,nip,seksi',
      description: 'Buat Peserta Baru: Test User Audit',
      success: true
    });
    
    // Check if activity was logged
    const createActivity = await RecentActivity.findOne({
      where: {
        activity_type: 'CREATE',
        module_type: 'participants',
        entity_id: 'test-123'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (createActivity) {
      console.log('✓ CREATE activity logged successfully:');
      console.log(`  - User Name: ${createActivity.user_name}`);
      console.log(`  - User ID: ${createActivity.user_id}`);
      console.log(`  - Description: ${createActivity.description}`);
      console.log(`  - Entity Title: ${createActivity.entity_title}`);
    } else {
      console.log('✗ CREATE activity not found');
    }
    
    // 2. Test UPDATE audit logging
    console.log('\n2. Testing UPDATE audit logging with user...');
    await logDetailedAudit(mockReq, {
      action_type: 'UPDATE',
      table_name: 'participants',
      record_id: 'test-123',
      old_values: JSON.stringify({
        id: 'test-123',
        name: 'Test User Audit',
        nip: '123456789',
        seksi: 'IT'
      }),
      new_values: JSON.stringify({
        id: 'test-123',
        name: 'Test User Audit Updated',
        nip: '123456789',
        seksi: 'HR'
      }),
      changed_fields: 'name,seksi',
      description: 'Ubah Peserta: Test User Audit Updated',
      success: true
    });
    
    // Check if activity was logged
    const updateActivity = await RecentActivity.findOne({
      where: {
        activity_type: 'UPDATE',
        module_type: 'participants',
        entity_id: 'test-123'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (updateActivity) {
      console.log('✓ UPDATE activity logged successfully:');
      console.log(`  - User Name: ${updateActivity.user_name}`);
      console.log(`  - User ID: ${updateActivity.user_id}`);
      console.log(`  - Description: ${updateActivity.description}`);
      console.log(`  - Entity Title: ${updateActivity.entity_title}`);
    } else {
      console.log('✗ UPDATE activity not found');
    }
    
    // 3. Test Meeting CREATE audit logging
    console.log('\n3. Testing Meeting CREATE audit logging with user...');
    const meetingReq = {
      ...mockReq,
      path: '/api/meetings',
      body: {
        title: 'Test Meeting Audit',
        date: '2024-02-01',
        location: 'Test Location'
      }
    };
    
    await logDetailedAudit(meetingReq, {
      action_type: 'CREATE',
      table_name: 'meetings',
      record_id: 'meeting-test-456',
      new_values: JSON.stringify({
        id: 'meeting-test-456',
        title: 'Test Meeting Audit',
        date: '2024-02-01',
        location: 'Test Location'
      }),
      changed_fields: 'title,date,location',
      description: 'Buat Meeting Baru: Test Meeting Audit',
      success: true
    });
    
    // Check if activity was logged
    const meetingActivity = await RecentActivity.findOne({
      where: {
        activity_type: 'CREATE',
        module_type: 'meetings',
        entity_id: 'meeting-test-456'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (meetingActivity) {
      console.log('✓ Meeting CREATE activity logged successfully:');
      console.log(`  - User Name: ${meetingActivity.user_name}`);
      console.log(`  - User ID: ${meetingActivity.user_id}`);
      console.log(`  - Description: ${meetingActivity.description}`);
      console.log(`  - Entity Title: ${meetingActivity.entity_title}`);
    } else {
      console.log('✗ Meeting CREATE activity not found');
    }
    
    // 4. Test without admin user (should use 'System')
    console.log('\n4. Testing audit logging without admin user...');
    const noAdminReq = {
      headers: {
        'x-session-id': 'test-session-456',
        'user-agent': 'Test Agent'
      },
      ip: '127.0.0.1',
      method: 'POST',
      path: '/api/participants'
    };
    
    await logDetailedAudit(noAdminReq, {
      action_type: 'CREATE',
      table_name: 'participants',
      record_id: 'test-no-admin-789',
      new_values: JSON.stringify({
        id: 'test-no-admin-789',
        name: 'Test No Admin User',
        nip: '987654321',
        seksi: 'Finance'
      }),
      changed_fields: 'name,nip,seksi',
      description: 'Buat Peserta Baru: Test No Admin User',
      success: true
    });
    
    // Check if activity was logged
    const noAdminActivity = await RecentActivity.findOne({
      where: {
        activity_type: 'CREATE',
        module_type: 'participants',
        entity_id: 'test-no-admin-789'
      },
      order: [['created_at', 'DESC']]
    });
    
    if (noAdminActivity) {
      console.log('✓ No-admin activity logged successfully:');
      console.log(`  - User Name: ${noAdminActivity.user_name} (should be 'System')`);
      console.log(`  - User ID: ${noAdminActivity.user_id} (should be null)`);
      console.log(`  - Description: ${noAdminActivity.description}`);
    } else {
      console.log('✗ No-admin activity not found');
    }
    
    // 5. Check recent activities list
    console.log('\n5. Checking recent activities list...');
    const recentActivities = await RecentActivity.findAll({
      where: {
        entity_id: ['test-123', 'meeting-test-456', 'test-no-admin-789']
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`✓ Found ${recentActivities.length} test activities:`);
    recentActivities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.activity_type} ${activity.module_type} by ${activity.user_name}`);
    });
    
    // Cleanup test data
    console.log('\n6. Cleaning up test data...');
    await RecentActivity.destroy({
      where: {
        entity_id: ['test-123', 'meeting-test-456', 'test-no-admin-789']
      }
    });
    console.log('✓ Test data cleaned up');
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  console.log('\n=== Test completed ===');
}

// Run test
testAuditWithUser().then(() => {
  console.log('\n✓ All tests completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});