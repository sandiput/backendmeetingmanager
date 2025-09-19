const { Settings } = require("../models");
const { Op } = require("sequelize");
const { logDetailedAudit } = require("../middleware/auditLogger");

class SettingsController {
  // Get current settings
  async getSettings(req, res) {
    try {
      let settings = await Settings.findOne();

      // Create default settings if none exist
      if (!settings) {
        settings = await Settings.create({
          group_notification_time: "07:00",
          group_notification_enabled: false,
          individual_reminder_minutes: 60,
          individual_reminder_enabled: false,
          whatsapp_connected: false,
          whatsapp_group_id: "",
          notification_templates: {
            group_daily: "🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen",
            individual_reminder:
              "⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen",
          },
        });
      }

      // Log audit for settings view
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "settings",
        description: "Viewed system settings",
        success: true,
      });

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error("Error getting settings:", error);

      // Log audit for failed settings view
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "settings",
        description: "Failed to view system settings",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error retrieving settings",
      });
    }
  }

  // Update settings
  async updateSettings(req, res) {
    try {
      const updates = req.body;
      const [settings] = await Settings.findOrCreate({
        where: {},
        defaults: {
          group_notification_time: "07:00",
          group_notification_enabled: false,
          individual_reminder_minutes: 60,
          individual_reminder_enabled: false,
          whatsapp_connected: false,
          whatsapp_group_id: "",
          notification_templates: {
            group_daily: "🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen",
            individual_reminder:
              "⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen",
          },
        },
      });

      // Store old values for audit
      const oldValues = settings.toJSON();

      // Only update provided fields
      const updatedSettings = await settings.update(updates);

      // Update group notification schedule if time changed
      if (updates.group_notification_time && global.whatsappScheduler) {
        await global.whatsappScheduler.updateGroupNotificationSchedule();
      }

      // Determine changed fields
      const changedFields = Object.keys(updates).filter((key) => JSON.stringify(oldValues[key]) !== JSON.stringify(updatedSettings[key]));

      // Log audit for settings update
      await logDetailedAudit(req, {
        action_type: "UPDATE",
        table_name: "settings",
        record_id: updatedSettings.id,
        old_values: oldValues,
        new_values: updatedSettings.toJSON(),
        changed_fields: changedFields,

        success: true,
      });

      res.json({
        success: true,
        data: updatedSettings,
      });
    } catch (error) {
      console.error("Error updating settings:", error);

      // Log audit for failed settings update
      await logDetailedAudit(req, {
        action_type: "UPDATE",
        table_name: "settings",
        description: "Failed to update system settings",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error updating settings",
      });
    }
  }

  // Update notification templates
  async updateTemplates(req, res) {
    try {
      const { templates } = req.body;
      const [settings] = await Settings.findOrCreate({ where: {} });

      // Store old values for audit
      const oldTemplates = settings.notification_templates;

      const updatedSettings = await settings.update({
        notification_templates: {
          ...settings.notification_templates,
          ...templates,
        },
      });

      // Log audit for template update
      await logDetailedAudit(req, {
        action_type: "UPDATE",
        table_name: "settings",
        record_id: updatedSettings.id,
        old_values: { notification_templates: oldTemplates },
        new_values: { notification_templates: updatedSettings.notification_templates },
        changed_fields: ["notification_templates"],
        description: `Updated notification templates: ${Object.keys(templates).join(", ")}`,
        success: true,
      });

      res.json({
        success: true,
        data: updatedSettings.notification_templates,
      });
    } catch (error) {
      console.error("Error updating templates:", error);

      // Log audit for failed template update
      await logDetailedAudit(req, {
        action_type: "UPDATE",
        table_name: "settings",
        description: "Failed to update notification templates",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error updating notification templates",
      });
    }
  }

  // Preview group message
  async previewGroupMessage(req, res) {
    try {
      const { date } = req.query;
      const { Meeting } = require("../models");

      // Get settings for formatting
      const settings = await Settings.findOne();
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Settings not found",
        });
      }

      // Get meetings for the specified date
      const meetings = await Meeting.findAll({
        where: {
          date: date,
          group_notification_enabled: true,
        },
        order: [["start_time", "ASC"]],
      });

      // Format the group message using Settings model method
      const message = settings.formatGroupMessage(meetings);

      // Log audit for preview
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "settings",
        description: `Previewed group message for date: ${date}`,
        success: true,
      });

      res.json({
        success: true,
        data: {
          message: message,
          meetings: meetings,
        },
      });
    } catch (error) {
      console.error("Error previewing group message:", error);

      // Log audit for failed preview
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "settings",
        description: "Failed to preview group message",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error previewing group message",
      });
    }
  }
}

module.exports = new SettingsController();
