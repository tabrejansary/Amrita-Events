const Form = require('../models/Form');

// @desc    Create a new form
// @route   POST /api/forms
// @access  Private (Club/Admin)
exports.createForm = async (req, res) => {
    try {
        const { title, description, fields, isTemplate } = req.body;

        const form = await Form.create({
            title,
            description,
            fields,
            isTemplate: isTemplate || false,
            organizer: req.user.id
        });

        res.status(201).json({
            success: true,
            data: form
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all templates for the current user
// @route   GET /api/forms/templates
// @access  Private (Club/Admin)
exports.getTemplates = async (req, res) => {
    try {
        const forms = await Form.find({
            organizer: req.user.id,
            isTemplate: true
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: forms
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get form by ID
// @route   GET /api/forms/:id
// @access  Private
exports.getFormById = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.status(200).json({
            success: true,
            data: form
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private (Owner only)
exports.updateForm = async (req, res) => {
    try {
        let form = await Form.findById(req.params.id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Check ownership
        if (form.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this form'
            });
        }

        form = await Form.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: form
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private (Owner only)
exports.deleteForm = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Check ownership
        if (form.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this form'
            });
        }

        await form.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
