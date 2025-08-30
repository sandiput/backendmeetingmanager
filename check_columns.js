const { sequelize } = require('./src/models');

async function checkColumns() {
  try {
    const [results] = await sequelize.query('DESCRIBE meetings');
    console.log('Columns in meetings table:');
    results.forEach(column => {
      console.log(`- ${column.Field} (${column.Type})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkColumns();