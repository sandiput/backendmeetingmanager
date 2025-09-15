const express = require('express');
const router = express.Router();
const recentActivityController = require('../controllers/recentActivityController');

// Get recent activities (latest 3 by default)
// GET /api/recent-activities?limit=3&module_type=participants
router.get('/', recentActivityController.getRecentActivities);

// Get activities by specific module
// GET /api/recent-activities/participants?limit=10&page=1
router.get('/:module', recentActivityController.getActivitiesByModule);

module.exports = router;