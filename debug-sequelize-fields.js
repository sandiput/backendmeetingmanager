const { sequelize } = require('./src/config/database');
const Admin = require('./src/models/admin');

async function debugSequelizeFields() {
  try {
    console.log('🔍 Debugging Sequelize Admin model fields...\n');
    
    // Check model attributes
    console.log('📋 Model attributes:');
    console.log(Object.keys(Admin.rawAttributes));
    
    // Check table info
    const tableInfo = await sequelize.getQueryInterface().describeTable('admins');
    console.log('\n📊 Database table columns:');
    console.log(Object.keys(tableInfo));
    
    // Get a sample admin record
    const admin = await Admin.findOne({
      where: { username: 'admin' }
    });
    
    if (admin) {
      console.log('\n👤 Sample admin record (raw):');
      console.log(admin.dataValues);
      
      console.log('\n👤 Sample admin record (toJSON):');
      console.log(admin.toJSON());
      
      console.log('\n🔍 Available instance methods:');
      console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(admin)));
    }
    
    // Test direct query
    const [results] = await sequelize.query('SELECT * FROM admins WHERE username = "admin" LIMIT 1');
    console.log('\n🗄️ Direct SQL query result:');
    console.log(results[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugSequelizeFields();