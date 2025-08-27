const { Participant, Meeting } = require("../models");
const { Op } = require("sequelize");

class ParticipantController {
  // Get all participants with pagination
  async getAllParticipants(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Participant.findAndCountAll({
        limit,
        offset,
        order: [["name", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          participants: rows,
          total: count,
          page,
          total_pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Error getting participants:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving participants",
      });
    }
  }

  // Get single participant
  async getParticipant(req, res) {
    try {
      const participant = await Participant.findByPk(req.params.id, {
        include: [
          {
            model: Meeting,
            as: "meetings",
            through: { attributes: ["attendance_status", "attendance_time"] },
          },
        ],
      });

      if (!participant) {
        return res.status(404).json({
          success: false,
          message: "Participant not found",
        });
      }

      res.json({
        success: true,
        data: participant,
      });
    } catch (error) {
      console.error("Error getting participant:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving participant",
      });
    }
  }

  // Create new participant
  async createParticipant(req, res) {
    try {
      const { whatsapp_number, ...participantData } = req.body;

      // Format WhatsApp number
      if (whatsapp_number) {
        participantData.whatsapp_number = this.formatWhatsAppNumber(whatsapp_number);
      }

      const participant = await Participant.create(participantData);

      res.status(201).json({
        success: true,
        data: participant,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "A participant with this WhatsApp number already exists",
        });
      }

      console.error("Error creating participant:", error);
      res.status(500).json({
        success: false,
        message: "Error creating participant",
      });
    }
  }

  // Update participant
  async updateParticipant(req, res) {
    try {
      const participant = await Participant.findByPk(req.params.id);

      if (!participant) {
        return res.status(404).json({
          success: false,
          message: "Participant not found",
        });
      }

      const { whatsapp_number, ...updateData } = req.body;

      // Format WhatsApp number if provided
      if (whatsapp_number) {
        updateData.whatsapp_number = this.formatWhatsAppNumber(whatsapp_number);
      }

      await participant.update(updateData);

      res.json({
        success: true,
        data: participant,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "A participant with this WhatsApp number already exists",
        });
      }

      console.error("Error updating participant:", error);
      res.status(500).json({
        success: false,
        message: "Error updating participant",
      });
    }
  }

  // Delete participant
  async deleteParticipant(req, res) {
    try {
      const participant = await Participant.findByPk(req.params.id);

      if (!participant) {
        return res.status(404).json({
          success: false,
          message: "Participant not found",
        });
      }

      await participant.destroy();

      res.json({
        success: true,
        message: "Participant deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting participant:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting participant",
      });
    }
  }

  // Search participants
  async searchParticipants(req, res) {
    try {
      const { query, seksi } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const whereClause = {};

      if (query) {
        whereClause[Op.or] = [{ name: { [Op.like]: `%${query}%` } }, { whatsapp_number: { [Op.like]: `%${query}%` } }];
      }

      if (seksi) {
        whereClause.seksi = seksi;
      }

      const { count, rows } = await Participant.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["name", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          participants: rows,
          total: count,
          page,
          total_pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Error searching participants:", error);
      res.status(500).json({
        success: false,
        message: "Error searching participants",
      });
    }
  }

  // Get participants by seksi
  async getParticipantsBySeksi(req, res) {
    try {
      const { seksi } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Participant.findAndCountAll({
        where: { seksi },
        limit,
        offset,
        order: [["name", "ASC"]],
      });

      res.json({
        success: true,
        data: {
          participants: rows,
          total: count,
          page,
          total_pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Error getting participants by seksi:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving participants by seksi",
      });
    }
  }

  // Helper method to format WhatsApp number
  formatWhatsAppNumber(number) {
    // Remove any non-digit characters
    let cleaned = number.replace(/\D/g, "");

    // Remove leading 0 if present
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present
    if (!cleaned.startsWith("62")) {
      cleaned = "62" + cleaned;
    }

    return cleaned;
  }
}

module.exports = new ParticipantController();
