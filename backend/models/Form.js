const mongoose = require('mongoose');

const FormFieldSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['text', 'number', 'email', 'longText', 'radio', 'checkbox', 'select', 'date', 'time', 'phone'],
        required: true,
    },
    required: {
        type: Boolean,
        default: false,
    },
    options: {
        type: [String], // For radio, checkbox, select
        default: [],
    },
    placeholder: {
        type: String,
        default: '',
    },
    helpText: {
        type: String,
        default: '',
    }
});

const FormSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fields: [FormFieldSchema],
    isTemplate: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Form', FormSchema);
