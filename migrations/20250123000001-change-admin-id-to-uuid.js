'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get existing admin records
      const existingAdmins = await queryInterface.sequelize.query(
        'SELECT * FROM admins ORDER BY id',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      console.log(`Found ${existingAdmins.length} existing admin records`);
      
      // Create backup table
      await queryInterface.sequelize.query(
        'CREATE TABLE admins_backup AS SELECT * FROM admins',
        { transaction }
      );
      
      // Drop existing table
      await queryInterface.dropTable('admins', { transaction });
      
      // Create new table with UUID
      await queryInterface.createTable('admins', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        full_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('super_admin', 'admin'),
          allowNull: false,
          defaultValue: 'admin'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        last_login: {
          type: Sequelize.DATE,
          allowNull: true
        },
        profile_picture: {
          type: Sequelize.STRING,
          allowNull: true
        },
        whatsapp_number: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Insert existing data with new UUIDs
      const { v4: uuidv4 } = require('uuid');
      
      for (const admin of existingAdmins) {
        await queryInterface.bulkInsert('admins', [{
          id: uuidv4(),
          username: admin.username,
          email: admin.email,
          password: admin.password,
          full_name: admin.full_name,
          role: admin.role,
          is_active: admin.is_active,
          last_login: admin.last_login,
          profile_picture: admin.profile_picture,
          whatsapp_number: admin.whatsapp_number,
          created_at: admin.created_at,
          updated_at: admin.updated_at
        }], { transaction });
      }
      
      // Add indexes
      await queryInterface.addIndex('admins', ['username'], { transaction });
      await queryInterface.addIndex('admins', ['email'], { transaction });
      
      // Drop backup table
      await queryInterface.dropTable('admins_backup', { transaction });
      
      await transaction.commit();
      console.log('Successfully migrated admin table to UUID');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get existing admin records
      const existingAdmins = await queryInterface.sequelize.query(
        'SELECT * FROM admins ORDER BY created_at',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      // Drop existing table
      await queryInterface.dropTable('admins', { transaction });
      
      // Create table with integer ID
      await queryInterface.createTable('admins', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        full_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('super_admin', 'admin'),
          allowNull: false,
          defaultValue: 'admin'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        last_login: {
          type: Sequelize.DATE,
          allowNull: true
        },
        profile_picture: {
          type: Sequelize.STRING,
          allowNull: true
        },
        whatsapp_number: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // Insert data back with auto-increment IDs
      let idCounter = 1;
      for (const admin of existingAdmins) {
        await queryInterface.bulkInsert('admins', [{
          id: idCounter++,
          username: admin.username,
          email: admin.email,
          password: admin.password,
          full_name: admin.full_name,
          role: admin.role,
          is_active: admin.is_active,
          last_login: admin.last_login,
          profile_picture: admin.profile_picture,
          whatsapp_number: admin.whatsapp_number,
          created_at: admin.created_at,
          updated_at: admin.updated_at
        }], { transaction });
      }
      
      // Add indexes
      await queryInterface.addIndex('admins', ['username'], { transaction });
      await queryInterface.addIndex('admins', ['email'], { transaction });
      
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};