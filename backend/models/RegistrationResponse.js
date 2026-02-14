const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be string, array (for checkboxes), etc.
        required: true,
    }
});

const RegistrationResponseSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
    },
    answers: [AnswerSchema],
    submittedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

// Compound index to ensure a user only registers once for an event
RegistrationResponseSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('RegistrationResponse', RegistrationResponseSchema);
