const express = require('express');
const router = express.Router();
const {
    getKPIs,
    getTrends,
    getEventPerformance,
    getCategoryInsights,
    getUserInsights,
    getTopPerformers,
    getPlatformInsights
} = require('../controllers/analyticsController');

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);
router.use(authorize('admin'));

// Analytics routes
router.get('/kpis', getKPIs);
router.get('/trends', getTrends);
router.get('/event-performance', getEventPerformance);
router.get('/category-insights', getCategoryInsights);
router.get('/user-insights', getUserInsights);
router.get('/top-performers', getTopPerformers);
router.get('/insights', getPlatformInsights);

module.exports = router;
