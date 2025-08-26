#!/usr/bin/env node

require("dotenv").config();
const { Sequelize } = require('sequelize');

async function initializeDatabase() {
  let sequelizeNoDB;
  let sequelize;

  try {
    // 1️⃣ Koneksi tanpa database dulu
    sequelizeNoDB = new Sequelize({
      dialect: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      logging: false,
    });

    await sequelizeNoDB.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' ensured.`);

    await sequelizeNoDB.close();

    // 2️⃣ Reconnect dengan database yang sudah ada
    sequelize = new Sequelize({
      dialect: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      username: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      logging: console.log,
      timezone: "+07:00",
      dialectOptions: {
        timezone: "+07:00",
        dateStrings: true,
        typeCast: true,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // 3️⃣ Inisialisasi model Settings dengan koneksi baru
    const { Model, DataTypes } = require('sequelize');
    
    class Settings extends Model {}
    
    Settings.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      group_notification_time: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '07:00'
      },
      group_notification_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      individual_reminder_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
          min: 1,
          max: 120
        }
      },
      individual_reminder_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      whatsapp_connected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      whatsapp_group_id: {
        type: DataTypes.STRING
      },
      last_group_notification: {
        type: DataTypes.DATE
      },
      notification_templates: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          group_daily: '🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen',
          individual_reminder: '⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen'
        }
      }
    }, {
      sequelize,
      modelName: 'Settings',
      tableName: 'settings',
      timestamps: true
    });

    // 4️⃣ Sync tabel sesuai model
    await sequelize.sync({ force: true });
    console.log("Database synchronized successfully.");

    // 5️⃣ Insert default settings
    try {
      await Settings.create({
        group_notification_time: process.env.WHATSAPP_NOTIFICATION_TIME || "07:00",
        group_notification_enabled: process.env.WHATSAPP_GROUP_NOTIFICATION_ENABLED === "true",
        individual_reminder_minutes: 30,
        individual_reminder_enabled: process.env.WHATSAPP_REMINDER_ENABLED === "true",
        whatsapp_connected: false,
        whatsapp_group_id: process.env.WHATSAPP_GROUP_ID || "",
        last_group_notification: null,
        notification_templates: {
          group_daily: "🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen",
          individual_reminder: "⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen"
        }
      });
      console.log("Initial settings created successfully.");
    } catch (error) {
      console.error("Error creating initial settings:", error.message);
      throw new Error(`Failed to create initial settings: ${error.message}`);
    }

    console.log("Database initialization completed successfully.");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    
    // Pastikan koneksi ditutup jika terjadi error
    if (sequelizeNoDB) await sequelizeNoDB.close().catch(() => {});
    if (sequelize) await sequelize.close().catch(() => {});
    
    process.exit(1);
  }
}

initializeDatabase();
