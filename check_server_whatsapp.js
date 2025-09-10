const http = require('http');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && method === 'POST') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ data: jsonData, status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkServerWhatsApp() {
  try {
    console.log('🔍 Checking WhatsApp status via API endpoint...');
    
    // Check WhatsApp status via API
    const statusResponse = await makeRequest('http://localhost:8000/api/whatsapp/status');
    console.log('\n📊 WhatsApp Status from Server:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    if (statusResponse.data.success && statusResponse.data.data.isConnected) {
      console.log('\n✅ WhatsApp is connected on the server!');
      
      // Try to send a test reminder via API
      console.log('\n🧪 Testing reminder via API...');
      
      // First, get the meeting ID
      const meetingsResponse = await makeRequest('http://localhost:8000/api/meetings');
      console.log('📋 Meetings response:', JSON.stringify(meetingsResponse.data, null, 2));
      
      let meetings = [];
      if (meetingsResponse.data.success && meetingsResponse.data.data) {
        // Handle paginated response
        if (Array.isArray(meetingsResponse.data.data.data)) {
          meetings = meetingsResponse.data.data.data;
        } else if (Array.isArray(meetingsResponse.data.data)) {
          meetings = meetingsResponse.data.data;
        }
      } else if (Array.isArray(meetingsResponse.data)) {
        meetings = meetingsResponse.data;
      }
      
      if (meetings.length === 0) {
        console.log('❌ No meetings found or invalid response format');
        return;
      }
      
      console.log(`📊 Found ${meetings.length} meetings`);
      
      const targetMeeting = meetings.find(m => 
        m.title && m.title.includes('Rapat Peningkatan Kapasitas SDM')
      );
      
      if (targetMeeting) {
        console.log(`📅 Found meeting: ${targetMeeting.title} (ID: ${targetMeeting.id})`);
        
        // Send individual reminder via API
        try {
          const reminderResponse = await makeRequest(
            `http://localhost:8000/api/meetings/${targetMeeting.id}/send-reminder`,
            'POST',
            { type: 'individual' }
          );
          
          console.log('\n📤 Reminder API Response:');
          console.log(JSON.stringify(reminderResponse.data, null, 2));
          
          if (reminderResponse.data.success) {
            console.log('\n✅ SUCCESS: Reminder sent successfully via API!');
            
            // Check logs via API
            setTimeout(async () => {
              try {
                const logsResponse = await makeRequest('http://localhost:8000/api/whatsapp/logs');
                console.log('\n📋 Recent WhatsApp Logs:');
                const logs = logsResponse.data.data || [];
                logs.slice(0, 5).forEach((log, index) => {
                  console.log(`   ${index + 1}. ${log.message_type} to ${log.recipient_name} - ${log.status}`);
                  if (log.error_message) {
                    console.log(`      Error: ${log.error_message}`);
                  }
                });
              } catch (logError) {
                console.log('❌ Error fetching logs:', logError.message);
              }
            }, 2000);
            
          } else {
            console.log('❌ FAILED: Reminder not sent');
            console.log('Reason:', reminderResponse.data.message);
          }
          
        } catch (reminderError) {
          console.log('❌ Error sending reminder:', reminderError.response?.data || reminderError.message);
        }
        
      } else {
        console.log('❌ Meeting "Rapat Peningkatan Kapasitas SDM" not found');
      }
      
    } else {
      console.log('❌ WhatsApp is not connected on the server');
      console.log('\n🔧 Possible solutions:');
      console.log('   1. Check WhatsApp Web in browser');
      console.log('   2. Scan QR code if needed');
      console.log('   3. Check server logs for connection issues');
    }
    
  } catch (error) {
    console.error('❌ Error checking server WhatsApp status:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Server is not running on port 8000');
      console.log('   Please make sure the backend server is running with: npm run dev');
    }
  }
}

checkServerWhatsApp();