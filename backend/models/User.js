const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'employer', 'college_owner'],
        default: 'student'
    },
    
    // Student specific fields
    rollNo: String,
    branch: String,
    semester: Number,
    skills: [String],
    resume: String,
    
    // Employer specific fields
    companyName: String,
    companySize: String,
    industry: String,
    companyWebsite: String,
    companyDescription: String,
    
    // College Owner specific fields
    collegeName: String,
    collegeAddress: String,
    collegeCode: String,
    collegeWebsite: String,
    
    // Common fields
    profileCompleted: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (exclude password)
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);