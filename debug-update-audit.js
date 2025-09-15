const { RecentActivity } = require('./src/models');
const { logDetailedAudit } = require('./src/middleware/auditLogger');

async function debugUpdateAudit() {
  try {
    console.log('=== Debug UPDATE Audit Logging ===\n');
    
    // Generate test IDs (using strings for entity_id, integer for user_id)
    const testMeetingId1 = 'test-meeting-' + Date.now();
    const testMeetingId2 = 'test-meeting-' + (Date.now() + 1);
    const testAdminId = 1; // Integer for user_id
    
    // Mock request object
    const mockReq = {
      admin: {
        id: testAdminId,
        username: 'test_admin'
      },
      ip: '127.0.0.1',
      headers: {
        'x-session-id': 'test-session-123'
      }
    };
    
    console.log('1. Testing direct RecentActivity.create with meetings module_type...');
    
    try {
      const directCreate = await RecentActivity.create({
        activity_type: 'update',
        module_type: 'meeting',
        entity_id: testMeetingId1,
        entity_title: 'Test Meeting Direct',
        entity_data: { title: 'Test Meeting', location: 'Test Room' },
        user_id: testAdminId,
        user_name: 'test_admin',
        description: 'Direct create test for UPDATE'
      });
      
      console.log('✅ Direct create successful:', directCreate.id);
    } catch (directError) {
      console.log('❌ Direct create failed:', directError.message);
    }
    
    console.log('\n2. Testing logDetailedAudit function with meetings...');
    
    try {
      await logDetailedAudit(mockReq, {
        action_type: 'UPDATE',
        table_name: 'meetings',
        record_id: testMeetingId2,
        old_values: JSON.stringify({ title: 'Old Meeting Title', location: 'Old Room' }),
        new_values: JSON.stringify({ title: 'New Meeting Title', location: 'New Room' }),
        changed_fields: 'title,location',
        description: 'Test UPDATE via logDetailedAudit',
        success: true
      });
      
      console.log('✅ logDetailedAudit successful');
    } catch (auditError) {
      console.log('❌ logDetailedAudit failed:', auditError.message);
    }
    
    console.log('\n3. Checking RecentActivity model enum values...');
    
    console.log('Module type enum values: meeting, participant');
    console.log('Activity type enum values: create, update, delete');
    
    console.log('\n4. Querying recent audit logs...');
    
    const recentLogs = await RecentActivity.findAll({
      where: {
        entity_id: [testMeetingId1, testMeetingId2]
      },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Found ${recentLogs.length} test audit log(s):`);
    recentLogs.forEach(log => {
      console.log(`- ${log.activity_type} on ${log.module_type}: ${log.description} by ${log.user_name}`);
    });
    
    // Cleanup test data
    if (recentLogs.length > 0) {
      await RecentActivity.destroy({
        where: {
          entity_id: [testMeetingId1, testMeetingId2]
        }
      });
      console.log('\n✅ Test data cleaned up');
    }
    
    console.log('\n=== Debug completed ===');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugUpdateAudit();