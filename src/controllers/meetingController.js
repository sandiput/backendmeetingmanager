const { Meeting, Participant } = require('../models');
const WhatsAppService = require('../services/whatsappService');
const { validationResult } = require('express-validator');
const { Op, DataTypes } = require('sequelize');
const { normalizeTimeToISO } = require('../utils/validator');

class MeetingController {
  // Get all meetings with pagination and filters
  async getAllMeetings(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.per_page) || 10;
      const offset = (page - 1) * limit;

      let where = {};

      // Apply filters if provided
      if (req.query.status) {
        where.status = req.query.status;
      }
      if (req.query.date_from) {
        where.date = { [Op.gte]: req.query.date_from };
      }
      if (req.query.date_to) {
        where.date = { ...where.date, [Op.lte]: req.query.date_to };
      }

      const { count, rows: meetings } = await Meeting.findAndCountAll({
        where,
        order: [['date', 'ASC'], ['start_time', 'ASC']],
        offset,
        limit,
        include: [{
          model: Participant,
          as: 'participants',
          attributes: ['name', 'seksi'],
          through: { attributes: [] }
        }]
      });

      res.json({
        success: true,
        data: {
          data: meetings,
          current_page: page,
          last_page: Math.ceil(count / limit),
          per_page: limit,
          total: count
        }
      });
    } catch (error) {
      console.error('Error getting meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving meetings'
      });
    }
  }

  // Get upcoming meetings
  async getUpcomingMeetings(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const meetings = await Meeting.findAll({
        where: {
          date: { [Op.gte]: today }
        },
        order: [['date', 'ASC'], ['start_time', 'ASC']],
        include: [{
          model: Participant,
          as: 'participants',
          attributes: ['name', 'seksi'],
          through: { attributes: [] }
        }]
      });

      res.json({
        success: true,
        data: meetings
      });
    } catch (error) {
      console.error('Error getting upcoming meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving upcoming meetings'
      });
    }
  }

  // Get specific meeting
  async getMeeting(req, res) {
    try {
      const meeting = await Meeting.findByPk(req.params.id, {
        include: [{
          model: Participant,
          as: 'participants',
          attributes: ['name', 'seksi'],
          through: { attributes: [] }
        }]
      });

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Error getting meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving meeting'
      });
    }
  }

  // Create new meeting
  async createMeeting(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      // Find participants by name
      const participants = await Participant.findAll({
        where: {
          name: { [Op.in]: req.body.designated_attendees }
        }
      });
      
      // Normalize time fields to ISO format
      const meetingData = { ...req.body };
      if (meetingData.start_time) {
        meetingData.start_time = normalizeTimeToISO(meetingData.start_time) || meetingData.start_time;
      }
      if (meetingData.end_time) {
        meetingData.end_time = normalizeTimeToISO(meetingData.end_time) || meetingData.end_time;
      }

      const meeting = await Meeting.create(meetingData);
      await meeting.setParticipants(participants);

      // Reload meeting with participants
      await meeting.reload({
        include: [{
          model: Participant,
          as: 'participants',
          attributes: ['name', 'seksi'],
          through: { attributes: [] }
        }]
      });

      res.status(201).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating meeting'
      });
    }
  }

  // Update meeting
  async updateMeeting(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      // Validate meeting ID
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Meeting ID is required'
        });
      }

      console.log('Received update request for meeting ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      const meeting = await Meeting.findByPk(req.params.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      // Ensure meeting.id is preserved
      const meetingId = meeting.id;
      console.log('Found meeting with ID:', meetingId);

      // Update participants if designated_attendees is provided
      if (req.body.designated_attendees) {
        const participants = await Participant.findAll({
          where: {
            name: { [Op.in]: req.body.designated_attendees }
          }
        });
        
        // Import UUID function
        const { v4: uuidv4 } = require('uuid');
        
        // Log participants being set
        console.log('Setting participants for meeting:', meetingId);
        console.log('Participants:', participants.map(p => p.name));
        
        try {
          // Use individualHooks to generate unique IDs for each association
          await meeting.setParticipants(participants, { 
            individualHooks: true,
            through: { 
              // Don't set ID here, let Sequelize handle it with individualHooks
            }
          });
          console.log('Participants set successfully');
        } catch (error) {
          console.error('Error setting participants:', error);
          throw error;
        }
      }

      // Create a copy of req.body without the id field to prevent overriding
      const updateData = { ...req.body };
      delete updateData.id;
      
      // Normalize time fields to ISO format
      if (updateData.start_time) {
        updateData.start_time = normalizeTimeToISO(updateData.start_time) || updateData.start_time;
      }
      if (updateData.end_time) {
        updateData.end_time = normalizeTimeToISO(updateData.end_time) || updateData.end_time;
      }
      
      // Log the data being used for update
      console.log('Meeting ID for update:', meetingId);
      console.log('Update data:', JSON.stringify(updateData, null, 2));
      
      // Update meeting fields with explicit ID preservation
      updateData.id = meetingId; // Ensure ID is preserved
      await meeting.update(updateData);

      // Reload meeting with participants
      await meeting.reload({
        include: [{
          model: Participant,
          as: 'participants',
          attributes: ['name', 'seksi'],
          through: { attributes: [] }
        }]
      });

      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      console.error('Request body:', JSON.stringify(req.body, null, 2));
      res.status(500).json({
        success: false,
        message: 'Error updating meeting: ' + error.message
      });
    }
  }

  // Delete meeting
  async deleteMeeting(req, res) {
    try {
      const meeting = await Meeting.findByPk(req.params.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      await meeting.destroy();

      res.json({
        success: true,
        message: 'Meeting deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting meeting'
      });
    }
  }

  // Send WhatsApp reminder
  async sendReminder(req, res) {
    try {
      const meeting = await Meeting.findByPk(req.params.id, {
        include: [{
          model: Participant,
          as: 'participants',
          where: { is_active: true },
          attributes: ['name', 'whatsapp_number']
        }]
      });

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      // Send reminder to all active participants
      for (const participant of meeting.participants) {
        // Format time for display (remove seconds if present)
        const startTime = meeting.start_time.includes(':') ? 
          meeting.start_time.split(':').slice(0, 2).join(':') : 
          meeting.start_time;
        const endTime = meeting.end_time.includes(':') ? 
          meeting.end_time.split(':').slice(0, 2).join(':') : 
          meeting.end_time;
          
        await WhatsAppService.sendMessage(
          participant.whatsapp_number,
          `🔔 *Reminder Meeting*\n\n${meeting.title}\n📅 ${meeting.date}\n⏰ ${startTime} - ${endTime}\n📍 ${meeting.location}`
        );
      }

      await meeting.update({ reminder_sent_at: new Date() });

      res.json({
        success: true,
        message: 'Reminder sent successfully'
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending reminder'
      });
    }
  }

  // Search meetings
  async searchMeetings(req, res) {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const meetings = await Meeting.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { location: { [Op.like]: `%${query}%` } }
          ]
        },
        order: [['date', 'ASC'], ['start_time', 'ASC']],
        include: [{
          model: Participant,
          as: 'participants',
          attributes: ['id', 'name', 'seksi'],
          through: { attributes: [] }
        }]
      });

      if (meetings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        data: meetings
      });
    } catch (error) {
      console.error('Error searching meetings:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching meetings'
      });
    }
  }
}

module.exports = new MeetingController();