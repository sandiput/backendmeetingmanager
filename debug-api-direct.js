const Admin = require('./src/models/admin');
const { Op } = require('sequelize');

async function debugGetAllAdmins() {
  try {
    console.log('🔍 Testing getAllAdmins function directly...\n');
    
    const page = 1;
    const limit = 10;
    const search = '';
    const sortBy = 'created_at';
    const sortOrder = 'DESC';
    const offset = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search ? {
      [Op.or]: [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    // Get admins with pagination - exact same code as controller
    const { count, rows: admins } = await Admin.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] }
    });

    console.log('📊 Result count:', count);
    console.log('📊 Admins found:', admins.length);
    
    if (admins.length > 0) {
      console.log('\n👤 First admin raw data:');
      console.log(admins[0].dataValues);
      
      console.log('\n👤 First admin toJSON:');
      console.log(admins[0].toJSON());
      
      console.log('\n📋 All fields in first admin:');
      console.log(Object.keys(admins[0].dataValues));
    }

    // Test with raw: true
    console.log('\n🔍 Testing with raw: true...');
    const rawAdmins = await Admin.findAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] },
      raw: true
    });
    
    if (rawAdmins.length > 0) {
      console.log('\n👤 First admin (raw: true):');
      console.log(rawAdmins[0]);
      
      console.log('\n📋 All fields (raw: true):');
      console.log(Object.keys(rawAdmins[0]));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugGetAllAdmins();