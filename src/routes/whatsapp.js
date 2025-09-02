const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { Settings } = require('../models');

// Get WhatsApp connection status
router.get('/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    const qrData = whatsappService.getQRCode();
    const settings = await Settings.findOne();
    
    res.json({
      success: true,
      data: {
        isInitialized: status.isInitialized,
        isConnected: status.isConnected,
        isEnabled: status.isEnabled,
        qrCode: qrData.qrCode,
        qrAvailable: qrData.isAvailable,
        whatsapp_connected: settings?.whatsapp_connected || false,
        whatsapp_group_id: settings?.whatsapp_group_id || null
      }
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WhatsApp status',
      error: error.message
    });
  }
});

// Initialize WhatsApp connection
router.post('/connect', async (req, res) => {
  try {
    await whatsappService.initialize();
    
    res.json({
      success: true,
      message: 'WhatsApp connection initiated. Please scan QR code.'
    });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect WhatsApp',
      error: error.message
    });
  }
});

// Disconnect WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    await whatsappService.disconnect();
    
    // Update settings
    await Settings.update(
      { whatsapp_connected: false, whatsapp_group_id: null },
      { where: {} }
    );
    
    res.json({
      success: true,
      message: 'WhatsApp disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect WhatsApp',
      error: error.message
    });
  }
});

// Send test message
router.post('/test-message', async (req, res) => {
  try {
    const { type, recipient, message } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type and message are required'
      });
    }
    
    let result;
    
    if (type === 'group') {
      const settings = await Settings.findOne();
      if (!settings?.whatsapp_group_id) {
        return res.status(400).json({
          success: false,
          message: 'No WhatsApp group selected'
        });
      }
      result = await whatsappService.sendGroupMessage(settings.whatsapp_group_id, message);
    } else if (type === 'individual') {
      if (!recipient) {
        return res.status(400).json({
          success: false,
          message: 'Recipient is required for individual message'
        });
      }
      result = await whatsappService.sendIndividualMessage(recipient, message);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid message type. Use "group" or "individual"'
      });
    }
    
    res.json({
      success: true,
      message: 'Test message sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: error.message
    });
  }
});

// Get available WhatsApp groups
router.get('/groups', async (req, res) => {
  try {
    const groups = whatsappService.getAvailableGroups();
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Error getting WhatsApp groups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get WhatsApp groups',
      error: error.message 
    });
  }
});

// Update WhatsApp group
router.put('/group', async (req, res) => {
  try {
    const { groupId } = req.body;
    
    await Settings.update(
      { whatsapp_group_id: groupId },
      { where: { id: 1 } }
    );
    
    res.json({
      success: true,
      message: 'WhatsApp group updated successfully',
      data: { groupId }
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update WhatsApp group'
    });
  }
});

// Update notification templates
router.put('/templates', async (req, res) => {
  try {
    const { group_daily, individual_reminder } = req.body;
    
    const templates = {
      group_daily: group_daily || 'Good morning! Here are today\'s meetings: {meetings}',
      individual_reminder: individual_reminder || 'Reminder: You have a meeting "{title}" at {start_time}. Location: {location}'
    };
    
    await Settings.update(
      { notification_templates: templates },
      { where: { id: 1 } }
    );
    
    res.json({
      success: true,
      message: 'Templates updated successfully',
      data: templates
    });
  } catch (error) {
    console.error('Update templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update templates'
    });
  }
});

// Get notification templates
router.get('/templates', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    res.json({
      success: true,
      data: settings?.notification_templates || {
        group_daily: '*Jadwal Rapat Hari Ini*\\n*{date}*\\n\\n{meetings}\\n\\n📱 Pesan otomatis dari Meeting Manager\\n🤖 Subdirektorat Intelijen',
        individual_reminder: '*Pengingat Rapat*\\n\\n📅 {title}\\n🕐 {start_time} - {end_time}\\n📍 {location}\\n\\nRapat akan dimulai dalam 30 menit.{meeting_link}'
      }
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification templates',
      error: error.message
    });
  }
});

// Reinitialize WhatsApp service
router.post('/reinitialize', async (req, res) => {
  try {
    await whatsappService.disconnect();
    await whatsappService.initialize();
    
    res.json({
      success: true,
      message: 'WhatsApp service reinitialized'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;