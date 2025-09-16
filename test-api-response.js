const http = require('http');

// Fungsi untuk login dan mendapatkan token
function loginAdmin() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      username: 'admin', // Ganti dengan username admin yang valid
      password: 'admin123' // Ganti dengan password admin yang valid
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    console.log('Mencoba login untuk mendapatkan token...');

    const loginReq = http.request(loginOptions, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data && response.data.token) {
            console.log('✅ Login berhasil, token didapatkan!');
            resolve(response.data.token);
          } else {
            console.log('❌ Login gagal:', response.message || 'Unknown error');
            reject(new Error('Login failed'));
          }
        } catch (err) {
          console.error('❌ Error parsing login response:', err);
          reject(err);
        }
      });
    });

    loginReq.on('error', error => {
      console.error('❌ Error during login request:', error);
      reject(error);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

// Fungsi untuk mengakses API /admins dengan token
function testAdminsAPI(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/admins',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('Testing /api/admins endpoint dengan token...');

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.admins) {
            const hasIpAddress = json.data.admins.every(admin => 'ip_address' in admin);
            if (hasIpAddress) {
              console.log('✅ Field ip_address ditemukan di semua admin response!');
            } else {
              console.log('❌ Field ip_address TIDAK ditemukan di semua admin response!');
              console.log('Fields yang tersedia:', Object.keys(json.data.admins[0]));
            }
            // Print sample admin
            console.log('Contoh admin:', JSON.stringify(json.data.admins[0], null, 2));
          } else {
            console.log('❌ Response tidak sesuai format yang diharapkan:', json);
          }
          resolve();
        } catch (err) {
          console.error('❌ Error parsing response:', err);
          console.error('Raw response:', data);
          reject(err);
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Error testing API:', error);
      reject(error);
    });

    req.end();
  });
}

// Jalankan proses login dan testing secara berurutan
async function main() {
  try {
    const token = await loginAdmin();
    await testAdminsAPI(token);
  } catch (error) {
    console.error('Proses pengujian gagal:', error);
  }
}

main();