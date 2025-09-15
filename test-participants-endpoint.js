const axios = require('axios');
const { RecentActivity } = require('./src/models');

async function testParticipantsEndpoint() {
  try {
    console.log('Testing participants CREATE endpoint...');
    
    // Test CREATE participant with unique data
    const timestamp = Date.now();
    const createResponse = await axios.post('http://localhost:8000/api/participants', {
      name: `Test User ${timestamp}`,
      whatsapp_number: `08123456${timestamp.toString().slice(-4)}`,
      email: `test${timestamp}@example.com`,
      nip: `${timestamp.toString().slice(-5)}`,
      seksi: 'IT'
    });
    
    console.log('CREATE Response:', createResponse.data);
    
    if (createResponse.data.success) {
      const participantId = createResponse.data.data.id;
      console.log('✅ Participant created successfully with ID:', participantId);
      
      // Check audit log
      console.log('\nChecking audit logs...');
      const auditLogs = await RecentActivity.findAll({
        where: {
          module_type: 'participants',
          entity_id: participantId
        },
        order: [['created_at', 'DESC']]
      });
      
      console.log(`Found ${auditLogs.length} audit log(s):`);
      auditLogs.forEach(log => {
        console.log(`- ${log.action_type}: ${log.description} by ${log.user_name}`);
      });
      
      // Cleanup - delete the test participant
      try {
        const deleteResponse = await axios.delete(`http://localhost:8000/api/participants/${participantId}`);
        console.log('\n✅ Test participant deleted successfully');
      } catch (deleteError) {
        console.log('\n⚠️ Could not delete test participant (might need manual cleanup)');
      }
    }
    
    console.log('\n✅ Participant CREATE test completed!');
    
  } catch (error) {
    console.error('❌ Error testing participants endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testParticipantsEndpoint();