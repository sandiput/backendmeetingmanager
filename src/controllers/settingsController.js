const { Settings } = require('../models');
const { Op } = require('sequelize');

class SettingsController {
  // Get current settings
  async getSettings(req, res) {
    try {
      let settings = await Settings.findOne();

      // Create default settings if none exist
      if (!settings) {
        settings = await Settings.create({
          whatsapp_enabled: false,
          whatsapp_api_key: '',
          whatsapp_api_url: '',
          whatsapp_group_id: '',
          notification_templates: {
            reminder: 'Reminder: {meeting_title} akan dimulai pada {meeting_time}',
            confirmation: 'Konfirmasi kehadiran Anda untuk {meeting_title}',
            summary: 'Ringkasan rapat {meeting_title}: {summary}'
          }
        });
      }

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving settings'
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
          whatsapp_enabled: false,
          whatsapp_api_key: '',
          whatsapp_api_url: '',
          whatsapp_group_id: '',
          notification_templates: {
            reminder: 'Reminder: {meeting_title} akan dimulai pada {meeting_time}',
            confirmation: 'Konfirmasi kehadiran Anda untuk {meeting_title}',
            summary: 'Ringkasan rapat {meeting_title}: {summary}'
          }
        }
      });

      // Only update provided fields
      const updatedSettings = await settings.update(updates);

      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating settings'
      });
    }
  }

  // Test WhatsApp integration
  async testWhatsApp(req, res) {
    try {
      const settings = await Settings.findOne();

      if (!settings || !settings.whatsapp_enabled) {
        return res.status(400).json({
          success: false,
          message: 'WhatsApp integration is not enabled'
        });
      }

      // Implement WhatsApp test logic here
      const testResult = await this.sendTestWhatsAppMessage(settings);

      res.json({
        success: true,
        message: 'WhatsApp test successful',
        data: testResult
      });
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: 'Error testing WhatsApp integration'
      });
    }
  }

  // Update notification templates
  async updateTemplates(req, res) {
    try {
      const { templates } = req.body;
      const [settings] = await Settings.findOrCreate({ where: {} });

      const updatedSettings = await settings.update({
        notification_templates: {
          ...settings.notification_templates,
          ...templates
        }
      });

      res.json({
        success: true,
        data: updatedSettings.notification_templates
      });
    } catch (error) {
      console.error('Error updating templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating notification templates'
      });
    }
  }

  // Set WhatsApp group
  async setWhatsAppGroup(req, res) {
    try {
      const { group_id } = req.body;
      const [settings] = await Settings.findOrCreate({ where: {} });

      const updatedSettings = await settings.update({
        whatsapp_group_id: group_id
      });

      res.json({
        success: true,
        data: {
          whatsapp_group_id: updatedSettings.whatsapp_group_id
        }
      });
    } catch (error) {
      console.error('Error setting WhatsApp group:', error);
      res.status(500).json({
        success: false,
        message: 'Error setting WhatsApp group'
      });
    }
  }

  // Helper method for testing WhatsApp
  async sendTestWhatsAppMessage(settings) {
    // Implement actual WhatsApp API integration here
    return {
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SettingsController();