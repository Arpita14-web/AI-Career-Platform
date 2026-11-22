const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    postingType: {
        type: String,
        required: true,
        enum: ['job', 'internship']
    },
    department: {
        type: String,
        required: true,
        enum: ['engineering', 'data-science', 'design', 'marketing', 'hr']
    },
    jobTitle: {
        type: String,
        required: true,
        trim: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    requiredSkills: {
        type: [String],
        required: true
    },
    preferredSkills: {
        type: [String],
        default: []
    },
    experienceLevel: {
        type: String,
        required: true,
        enum: ['intern', 'junior', 'mid', 'senior']
    },
    location: {
        type: String,
        required: true,
        enum: ['remote', 'hybrid', 'onsite']
    },
    enableAI: {
        type: Boolean,
        default: true
    },
    aiPreferences: {
        matchSkills: { type: Boolean, default: true },
        matchExperience: { type: Boolean, default: true },
        matchCulture: { type: Boolean, default: true }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'closed'],
        default: 'active'
    },
    applicants: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'rejected', 'accepted'],
            default: 'pending'
        }
    }]
}, {
    timestamps: true
});

// Index for better query performance
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ createdBy: 1 });
jobSchema.index({ department: 1, experienceLevel: 1 });

module.exports = mongoose.model('Job', jobSchema);