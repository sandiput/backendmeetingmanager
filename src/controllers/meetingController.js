const { Meeting, Participant } = require('../models');
const WhatsAppService = require('../services/whatsappService');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

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

      const meeting = await Meeting.create(req.body);
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

      const meeting = await Meeting.findByPk(req.params.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
      }

      // Update participants if designated_attendees is provided
      if (req.body.designated_attendees) {
        const participants = await Participant.findAll({
          where: {
            name: { [Op.in]: req.body.designated_attendees }
          }
        });
        await meeting.setParticipants(participants);
      }

      // Update meeting fields
      await meeting.update(req.body);

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
      res.status(500).json({
        success: false,
        message: 'Error updating meeting'
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
        await WhatsAppService.sendMessage(
          participant.whatsapp_number,
          `🔔 *Reminder Meeting*\n\n${meeting.title}\n📅 ${meeting.date}\n⏰ ${meeting.start_time} - ${meeting.end_time}\n📍 ${meeting.location}`
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