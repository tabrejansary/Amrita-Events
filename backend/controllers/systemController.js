const SystemConfig = require('../models/SystemConfig');

// @desc    Get all system settings
// @route   GET /api/system
// @access  Public
exports.getSettings = async (req, res) => {
    try {
        let config = await SystemConfig.findOne({ configKey: 'global' });

        // Create default config if not exists
        if (!config) {
            config = await SystemConfig.create({ configKey: 'global' });
        }

        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update system settings
// @route   PUT /api/system
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    try {
        const { categories, departments, years } = req.body;

        let config = await SystemConfig.findOne({ configKey: 'global' });

        if (!config) {
            config = new SystemConfig({ configKey: 'global' });
        }

        if (categories) config.categories = categories;
        if (departments) config.departments = departments;
        if (years) config.years = years;

        await config.save();

        res.status(200).json({
            success: true,
            data: config,
            message: 'System settings updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
