const { DaftarKantor } = require("../models");
const { Op } = require("sequelize");
const { logDetailedAudit } = require("../middleware/auditLogger");

class DaftarKantorController {
  // Get all kantor for suggestions
  async getAllKantor(req, res) {
    try {
      const kantorList = await DaftarKantor.findAll({
        attributes: ['kd_kantor', 'nama_kantor_pendek', 'nama_kantor_lengkap'],
        order: [['nama_kantor_pendek', 'ASC']]
      });

      // Log audit for kantor list view
      await logDetailedAudit(req, {
        action_type: 'READ',
        table_name: 'daftar_kantor',
        description: `Retrieved kantor list (${kantorList.length} results)`,
        success: true
      });

      res.json({
        success: true,
        data: kantorList
      });
    } catch (error) {
      console.error('Error getting kantor list:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving kantor list'
      });
    }
  }

  // Search kantor by name
  async searchKantor(req, res) {
    try {
      const { query } = req.params;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const kantorList = await DaftarKantor.findAll({
        where: {
          [Op.or]: [
            { nama_kantor_pendek: { [Op.like]: `%${query}%` } },
            { nama_kantor_lengkap: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: ['kd_kantor', 'nama_kantor_pendek', 'nama_kantor_lengkap'],
        order: [['nama_kantor_pendek', 'ASC']],
        limit: 20
      });

      // Log audit for kantor search
      await logDetailedAudit(req, {
        action_type: 'read',
        table_name: 'daftar_kantor',
        description: `Search kantor with query: ${query} (${kantorList.length} results)`,
        success: true
      });

      res.json({
        success: true,
        data: kantorList
      });
    } catch (error) {
      console.error('Error searching kantor:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching kantor'
      });
    }
  }
}

module.exports = new DaftarKantorController();