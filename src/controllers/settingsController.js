const { Settings } = require('../models');
const { Op } = require('sequelize');
const { logDetailedAudit } = require('../middleware/auditLogger');

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

      // Log audit for settings view
      await logDetailedAudit(req, {
        action_type: 'READ',
        table_name: 'settings',
        description: 'Viewed system settings',
        success: true
      });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      
      // Log audit for failed settings view
      await logDetailedAudit(req, {
        action_type: 'READ',
        table_name: 'settings',
        description: 'Failed to view system settings',
        success: false,
        error_message: error.message
      });
      
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

      // Store old values for audit
      const oldValues = settings.toJSON();
      
      // Only update provided fields
      const updatedSettings = await settings.update(updates);
      
      // Determine changed fields
      const changedFields = Object.keys(updates).filter(key => 
        JSON.stringify(oldValues[key]) !== JSON.stringify(updatedSettings[key])
      );

      // Log audit for settings update
      await logDetailedAudit(req, {
        action_type: 'UPDATE',
        table_name: 'settings',
        record_id: updatedSettings.id,
        old_values: oldValues,
        new_values: updatedSettings.toJSON(),
        changed_fields: changedFields,
        description: `Ubah Pengaturan Sistem: ${changedFields.join(', ')}`,
        success: true
      });

      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      
      // Log audit for failed settings update
      await logDetailedAudit(req, {
        action_type: 'UPDATE',
        table_name: 'settings',
        description: 'Failed to update system settings',
        success: false,
        error_message: error.message
      });
      
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

      // Log audit for WhatsApp test
      await logDetailedAudit(req, {
        action_type: 'READ',
        table_name: 'settings',
        description: 'Tested WhatsApp integration',
        success: true
      });

      res.json({
        success: true,
        message: 'WhatsApp test successful',
        data: testResult
      });
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      
      // Log audit for failed WhatsApp test
      await logDetailedAudit(req, {
        action_type: 'READ',
        table_name: 'settings',
        description: 'Failed to test WhatsApp integration',
        success: false,
        error_message: error.message
      });
      
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

      // Store old values for audit
      const oldTemplates = settings.notification_templates;
      
      const updatedSettings = await settings.update({
        notification_templates: {
          ...settings.notification_templates,
          ...templates
        }
      });

      // Log audit for template update
      await logDetailedAudit(req, {
        action_type: 'UPDATE',
        table_name: 'settings',
        record_id: updatedSettings.id,
        old_values: { notification_templates: oldTemplates },
        new_values: { notification_templates: updatedSettings.notification_templates },
        changed_fields: ['notification_templates'],
        description: `Updated notification templates: ${Object.keys(templates).join(', ')}`,
        success: true
      });

      res.json({
        success: true,
        data: updatedSettings.notification_templates
      });
    } catch (error) {
      console.error('Error updating templates:', error);
      
      // Log audit for failed template update
      await logDetailedAudit(req, {
        action_type: 'UPDATE',
        table_name: 'settings',
        description: 'Failed to update notification templates',
        success: false,
        error_message: error.message
      });
      
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

      // Store old value for audit
      const oldGroupId = settings.whatsapp_group_id;
      
      const updatedSettings = await settings.update({
        whatsapp_group_id: group_id
      });

      // Log audit for WhatsApp group update
      await logDetailedAudit(req, {
        action_type: 'UPDATE',
        table_name: 'settings',
        record_id: updatedSettings.id,
        old_values: { whatsapp_group_id: oldGroupId },
        new_values: { whatsapp_group_id: updatedSettings.whatsapp_group_id },
        changed_fields: ['whatsapp_group_id'],
        description: `Updated WhatsApp group ID from '${oldGroupId}' to '${group_id}'`,
        success: true
      });

      res.json({
        success: true,
        data: {
          whatsapp_group_id: updatedSettings.whatsapp_group_id
        }
      });
    } catch (error) {
      console.error('Error setting WhatsApp group:', error);
      
      // Log audit for failed WhatsApp group update
      await logDetailedAudit(req, {
        action_type: 'UPDATE',
        table_name: 'settings',
        description: 'Failed to update WhatsApp group ID',
        success: false,
        error_message: error.message
      });
      
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