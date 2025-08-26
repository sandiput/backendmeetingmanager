#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('../config/database');

const umzug = new Umzug({
  migrations: { glob: 'src/migrations/*.js' },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Function to run migrations
async function runMigrations() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Run pending migrations
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      console.log('No pending migrations to run.');
    } else {
      console.log('Migrations executed successfully:');
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Function to rollback migrations
async function rollbackMigrations() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Rollback all migrations
    const migrations = await umzug.down({ to: 0 });
    
    if (migrations.length === 0) {
      console.log('No migrations to rollback.');
    } else {
      console.log('Migrations rolled back successfully:');
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error rolling back migrations:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--rollback')) {
  rollbackMigrations();
} else {
  runMigrations();
}