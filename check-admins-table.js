const { sequelize } = require('./src/config/database');

async function checkAdminsTable() {
  try {
    console.log('Memeriksa struktur tabel admins...\n');
    
    const columns = await sequelize.getQueryInterface().describeTable('admins');
    
    console.log('Kolom yang ada di tabel admins:');
    console.log('================================');
    
    Object.keys(columns).forEach(columnName => {
      const column = columns[columnName];
      console.log(`- ${columnName}: ${column.type} ${column.allowNull ? '(nullable)' : '(not null)'}`);
    });
    
    // Cek apakah kolom ip_address ada
    if (columns.ip_address) {
      console.log('\n✅ Kolom ip_address sudah ada di tabel admins');
      console.log(`   Tipe: ${columns.ip_address.type}`);
      console.log(`   Nullable: ${columns.ip_address.allowNull ? 'Ya' : 'Tidak'}`);
    } else {
      console.log('\n❌ Kolom ip_address TIDAK ada di tabel admins');
    }
    
    // Cek data sample
    console.log('\n--- Sample data dari tabel admins ---');
    const [results] = await sequelize.query('SELECT id, username, last_login, ip_address FROM admins LIMIT 3');
    
    if (results.length > 0) {
      results.forEach(admin => {
        console.log(`ID: ${admin.id}, Username: ${admin.username}, Last Login: ${admin.last_login}, IP: ${admin.ip_address || 'NULL'}`);
      });
    } else {
      console.log('Tidak ada data admin ditemukan');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkAdminsTable();