const mongoose = require('mongoose');
console.log('🔵 Profile model loaded - MongoDB connection state:', mongoose.connection.readyState);

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Personal Information
    personalInfo: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        }
    },
    
    // Academic Information
    academicInfo: {
        degree: {
            type: String,
            required: true
        },
        institution: {
            type: String,
            required: true,
            trim: true
        },
        branch: {
            type: String,
            required: true
        },
        cgpa: {
            type: Number,
            min: 0,
            max: 10,
            required: true
        },
        graduationYear: {
            type: Number,
            required: true
        },
        semester: {
            type: Number,
            min: 1,
            max: 8
        }
    },
    
    // Skills
    skills: {
        technical: [{
            type: String,
            trim: true
        }],
        soft: [{
            type: String,
            trim: true
        }]
    },
    
    // Career Preferences
    careerPreferences: {
        interestedDomains: {
            type: String,
            required: true
        },
        careerGoals: {
            type: String,
            required: true
        },
        preferredLocation: {
            type: String,
            trim: true
        }
    },
    
    // Resume & Portfolio
    resumeInfo: {
        resumeFile: {
            filename: String,
            originalName: String,
            path: String,
            size: Number,
            mimetype: String
        },
        portfolioLink: {
            type: String,
            trim: true
        }
    },
    
    // Profile completion tracking
    completionStatus: {
        personal: { type: Boolean, default: false },
        academic: { type: Boolean, default: false },
        skills: { type: Boolean, default: false },
        career: { type: Boolean, default: false },
        resume: { type: Boolean, default: false }
    },
    
    profileCompleted: {
        type: Boolean,
        default: false
    },
    
    lastUpdated: {
        type: Date,
        default: Date.now
    }
    
}, {
    timestamps: true
});

// Calculate completion percentage
profileSchema.methods.calculateCompletion = function() {
    const sections = Object.values(this.completionStatus);
    const completedSections = sections.filter(status => status).length;
    return Math.round((completedSections / sections.length) * 100);
};

// Update completion status before saving
profileSchema.pre('save', function(next) {
    // Check personal info completion
    this.completionStatus.personal = !!(this.personalInfo.fullName && this.personalInfo.email);
    
    // Check academic info completion
    this.completionStatus.academic = !!(this.academicInfo.degree && this.academicInfo.institution && 
                                      this.academicInfo.branch && this.academicInfo.cgpa && 
                                      this.academicInfo.graduationYear);
    
    // Check skills completion (at least one skill in either category)
    this.completionStatus.skills = !!(this.skills.technical.length > 0 || this.skills.soft.length > 0);
    
    // Check career preferences completion
    this.completionStatus.career = !!(this.careerPreferences.interestedDomains && this.careerPreferences.careerGoals);
    
    // Check resume completion
    this.completionStatus.resume = !!(this.resumeInfo.resumeFile && this.resumeInfo.resumeFile.filename);
    
    // Check if all sections are completed
    const allCompleted = Object.values(this.completionStatus).every(status => status);
    this.profileCompleted = allCompleted;
    
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Profile', profileSchema);