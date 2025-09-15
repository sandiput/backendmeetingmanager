const axios = require('axios');
const { RecentActivity } = require('./src/models');

async function testMeetingsEndpoint() {
  try {
    console.log('Testing meetings CREATE endpoint...');
    
    // Test CREATE meeting with unique data
    const timestamp = Date.now();
    const createResponse = await axios.post('http://localhost:8000/api/meetings', {
      title: `Test Meeting ${timestamp}`,
      date: '2025-12-31',
      start_time: '10:00',
      end_time: '12:00',
      location: 'Test Room',
      agenda: 'Test agenda for meeting',
      invited_by: 'Test Admin',
      invitation_letter_reference: `REF-${timestamp}`
    });
    
    console.log('CREATE Response:', createResponse.data);
    
    if (createResponse.data.success) {
      const meetingId = createResponse.data.data.id;
      console.log('✅ Meeting created successfully with ID:', meetingId);
      
      // Check audit log
      console.log('\nChecking audit logs...');
      const auditLogs = await RecentActivity.findAll({
        where: {
          module_type: 'meetings',
          entity_id: meetingId
        },
        order: [['created_at', 'DESC']]
      });
      
      console.log(`Found ${auditLogs.length} audit log(s):`);
      auditLogs.forEach(log => {
        console.log(`- ${log.activity_type}: ${log.description} by ${log.user_name}`);
      });
      
      // Test UPDATE meeting
      console.log('\nTesting UPDATE meeting...');
      const updateResponse = await axios.put(`http://localhost:8000/api/meetings/${meetingId}`, {
        title: `Updated Test Meeting ${timestamp}`,
        date: '2025-12-31',
        start_time: '10:00',
        end_time: '13:00',
        location: 'Updated Test Room',
        agenda: 'Updated test agenda for meeting',
        invited_by: 'Test Admin',
        invitation_letter_reference: `REF-${timestamp}`
      });
      
      console.log('UPDATE Response:', updateResponse.data);
      
      // Check audit logs after update
      console.log('\nChecking audit logs after update...');
      const updatedAuditLogs = await RecentActivity.findAll({
        where: {
          module_type: 'meetings',
          entity_id: meetingId
        },
        order: [['created_at', 'DESC']]
      });
      
      console.log(`Found ${updatedAuditLogs.length} audit log(s):`);
      updatedAuditLogs.forEach(log => {
        console.log(`- ${log.activity_type}: ${log.description} by ${log.user_name}`);
      });
      
      // Cleanup - delete the test meeting
      try {
        const deleteResponse = await axios.delete(`http://localhost:8000/api/meetings/${meetingId}`);
        console.log('\n✅ Test meeting deleted successfully');
        
        // Check audit logs after delete
        console.log('\nChecking audit logs after delete...');
        const finalAuditLogs = await RecentActivity.findAll({
          where: {
            module_type: 'meetings',
            entity_id: meetingId
          },
          order: [['created_at', 'DESC']]
        });
        
        console.log(`Found ${finalAuditLogs.length} audit log(s):`);
        finalAuditLogs.forEach(log => {
          console.log(`- ${log.activity_type}: ${log.description} by ${log.user_name}`);
        });
        
      } catch (deleteError) {
        console.log('\n⚠️ Could not delete test meeting (might need manual cleanup)');
      }
    }
    
    console.log('\n✅ Meeting CRUD test completed!');
    
  } catch (error) {
    console.error('❌ Error testing meetings endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMeetingsEndpoint();