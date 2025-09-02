const { Meeting, Participant, Settings } = require("../models");
const { validationResult } = require("express-validator");
const { Op, DataTypes } = require("sequelize");
const { normalizeTimeToISO } = require("../utils/validator");
const { logDetailedAudit } = require("../middleware/auditLogger");

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

      // If no status filter is applied, we need to sort by status first (upcoming first)
      let meetings, count;
      if (!req.query.status) {
        // Get all meetings without pagination first to sort by status
        const meetingsRaw = await Meeting.findAll({
          where,
          include: [
            {
              model: Participant,
              as: "participants",
              attributes: ["name", "seksi"],
              through: { attributes: [] },
            },
          ],
        });

        // Separate and sort meetings by status
        const upcomingMeetings = meetingsRaw
          .filter((m) => m.status === "upcoming")
          .sort((a, b) => {
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            return a.start_time.localeCompare(b.start_time);
          });

        const completedMeetings = meetingsRaw
          .filter((m) => m.status === "completed")
          .sort((a, b) => {
            if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
            return b.start_time.localeCompare(a.start_time);
          });

        // Combine: upcoming first, then completed
        const sortedMeetings = [...upcomingMeetings, ...completedMeetings];

        // Apply pagination to sorted results
        count = sortedMeetings.length;
        meetings = sortedMeetings.slice(offset, offset + limit);
      } else {
        // If status filter is applied, use normal query with pagination
        const result = await Meeting.findAndCountAll({
          where,
          order: [
            ["date", "ASC"],
            ["start_time", "ASC"],
          ],
          offset,
          limit,
          include: [
            {
              model: Participant,
              as: "participants",
              attributes: ["name", "seksi"],
              through: { attributes: [] },
            },
          ],
        });
        count = result.count;
        meetings = result.rows;
      }

      // Log audit for meetings list view
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "meetings",
        description: `Lihat Daftar Meeting (halaman ${page}, ${meetings.length} hasil)`,
        success: true,
      });

      res.json({
        success: true,
        data: {
          data: meetings,
          current_page: page,
          last_page: Math.ceil(count / limit),
          per_page: limit,
          total: count,
        },
      });
    } catch (error) {
      console.error("Error getting meetings:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving meetings",
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
          date: { [Op.gte]: today },
        },
        order: [
          ["date", "ASC"],
          ["start_time", "ASC"],
        ],
        include: [
          {
            model: Participant,
            as: "participants",
            attributes: ["name", "seksi"],
            through: { attributes: [] },
          },
        ],
      });

      // Log audit for upcoming meetings view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "meetings",
        description: `Lihat Meeting Mendatang (${meetings.length} hasil)`,
        success: true,
      });

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error) {
      console.error("Error getting upcoming meetings:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving upcoming meetings",
      });
    }
  }

  // Get specific meeting
  async getMeeting(req, res) {
    try {
      const meeting = await Meeting.findByPk(req.params.id, {
        include: [
          {
            model: Participant,
            as: "participants",
            attributes: ["name", "seksi"],
            through: { attributes: [] },
          },
        ],
      });

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      // Log audit for meeting read
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "meetings",
        record_id: meeting.id,
        description: `Lihat Detail Meeting: ${meeting.title}`,
        success: true,
      });

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      console.error("Error getting meeting:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving meeting",
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
          message: "Validation error",
          errors: errors.array(),
        });
      }

      // Find participants by name (if designated_attendees is provided)
      let participants = [];
      if (
        req.body.designated_attendees &&
        Array.isArray(req.body.designated_attendees)
      ) {
        participants = await Participant.findAll({
          where: {
            name: { [Op.in]: req.body.designated_attendees },
          },
        });
      }

      // Use meeting data as is without time normalization
      const meetingData = { ...req.body };
      const meeting = await Meeting.create(meetingData);
      await meeting.setParticipants(participants);

      // Reload meeting with participants
      await meeting.reload({
        include: [
          {
            model: Participant,
            as: "participants",
            attributes: ["name", "seksi"],
            through: { attributes: [] },
          },
        ],
      });

      // Log audit for meeting creation
      await logDetailedAudit(req, {
        action_type: "CREATE",
        table_name: "meetings",
        record_id: meeting.id,
        new_values: JSON.stringify(meeting.toJSON()),
        changed_fields: Object.keys(meetingData).join(","),
        description: `Buat Meeting Baru: ${meeting.title}`,
        success: true,
      });

      res.status(201).json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({
        success: false,
        message: "Error creating meeting",
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
          message: "Validation error",
          errors: errors.array(),
        });
      }

      // Validate meeting ID
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Meeting ID is required",
        });
      }

      console.log("Received update request for meeting ID:", req.params.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const meeting = await Meeting.findByPk(req.params.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      // Ensure meeting.id is preserved
      const meetingId = meeting.id;
      console.log("Found meeting with ID:", meetingId);

      // Update participants if designated_attendees is provided
      if (req.body.designated_attendees) {
        const participants = await Participant.findAll({
          where: {
            name: { [Op.in]: req.body.designated_attendees },
          },
        });

        // Import UUID function
        const { v4: uuidv4 } = require("uuid");

        // Log participants being set
        console.log("Setting participants for meeting:", meetingId);
        console.log(
          "Participants:",
          participants.map((p) => p.name)
        );

        try {
          // Use individualHooks to generate unique IDs for each association
          await meeting.setParticipants(participants, {
            individualHooks: true,
            through: {
              // Don't set ID here, let Sequelize handle it with individualHooks
            },
          });
          console.log("Participants set successfully");
        } catch (error) {
          console.error("Error setting participants:", error);
          throw error;
        }
      }

      // Create a copy of req.body without the id field to prevent overriding
      const updateData = { ...req.body };
      delete updateData.id;

      // Use time data as is without normalization

      // Log the data being used for update
      console.log("Meeting ID for update:", meetingId);
      console.log("Update data:", JSON.stringify(updateData, null, 2));

      // Store old values for audit
      const oldValues = { ...meeting.dataValues };

      // Update meeting fields with explicit ID preservation
      updateData.id = meetingId; // Ensure ID is preserved
      await meeting.update(updateData);

      // Reload meeting with participants
      await meeting.reload({
        include: [
          {
            model: Participant,
            as: "participants",
            attributes: ["name", "seksi"],
            through: { attributes: [] },
          },
        ],
      });

      // Log audit for meeting update
      const changedFields = Object.keys(updateData).filter(
        (key) => key !== "id" && oldValues[key] !== updateData[key]
      );

      await logDetailedAudit(req, {
        action_type: "UPDATE",
        table_name: "meetings",
        record_id: meeting.id,
        old_values: JSON.stringify(oldValues),
        new_values: JSON.stringify(meeting.toJSON()),
        changed_fields: changedFields.join(","),
        description: `Ubah Meeting: ${meeting.title}`,
        success: true,
      });

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      console.error("Error updating meeting:", error);
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      res.status(500).json({
        success: false,
        message: "Error updating meeting: " + error.message,
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
          message: "Meeting not found",
        });
      }

      // Store meeting data for audit before deletion
      const deletedMeetingData = { ...meeting.dataValues };

      await meeting.destroy();

      // Log audit for meeting deletion
      await logDetailedAudit(req, {
        action_type: "DELETE",
        table_name: "meetings",
        record_id: req.params.id,
        old_values: JSON.stringify(deletedMeetingData),
        description: `Hapus Meeting: ${deletedMeetingData.title}`,
        success: true,
      });

      res.json({
        success: true,
        message: "Meeting deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting meeting",
      });
    }
  }

  // Send reminder
  async sendReminder(req, res) {
    try {
      const meeting = await Meeting.findByPk(req.params.id);

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      // Log audit for reminder attempt
      await logDetailedAudit(req, {
        action_type: "UPDATE",
        table_name: "meetings",
        record_id: meeting.id,
        description: `Percobaan kirim reminder untuk meeting: ${meeting.title}`,
        success: false,
      });

      res.status(400).json({
        success: false,
        message: "WhatsApp reminder feature has been disabled. Please use alternative notification methods.",
      });
    } catch (error) {
      console.error("Error in sendReminder:", error);
      res.status(500).json({
        success: false,
        message: "Error processing reminder request",
        error: error.message
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
          message: "Search query is required",
        });
      }

      const meetings = await Meeting.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { location: { [Op.like]: `%${query}%` } },
          ],
        },
        order: [
          ["date", "ASC"],
          ["start_time", "ASC"],
        ],
        include: [
          {
            model: Participant,
            as: "participants",
            attributes: ["id", "name", "seksi"],
            through: { attributes: [] },
          },
        ],
      });

      if (meetings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      // Log audit for meeting search
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "meetings",
        description: `Searched meetings with query: "${query}" (${meetings.length} results)`,
        success: true,
      });

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error) {
      console.error("Error searching meetings:", error);
      res.status(500).json({
        success: false,
        message: "Error searching meetings",
      });
    }
  }
}

module.exports = new MeetingController();
