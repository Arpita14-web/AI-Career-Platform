const express = require('express');
const multer = require('multer');
const path = require('path');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});


// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
// @desc    Create or update user profile
// @route   POST /api/profile
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('🔵 Profile POST route hit');
        console.log('User ID:', req.user.id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const {
            personalInfo,
            academicInfo,
            skills,
            careerPreferences,
            resumeInfo
        } = req.body;

        // Find existing profile or create new one
        let profile = await Profile.findOne({ user: req.user.id });
        console.log('🔵 Existing profile found:', !!profile);

        if (profile) {
            // Update existing profile
            console.log('🔵 Updating existing profile');
            profile.personalInfo = { ...profile.personalInfo, ...personalInfo };
            profile.academicInfo = { ...profile.academicInfo, ...academicInfo };
            profile.skills = { ...profile.skills, ...skills };
            profile.careerPreferences = { ...profile.careerPreferences, ...careerPreferences };
            profile.resumeInfo = { ...profile.resumeInfo, ...resumeInfo };
        } else {
            // Create new profile
            console.log('🔵 Creating new profile');
            profile = new Profile({
                user: req.user.id,
                personalInfo,
                academicInfo,
                skills,
                careerPreferences,
                resumeInfo
            });
        }

        console.log('🔵 Profile object before save:', profile);

        // Save the profile
        const savedProfile = await profile.save();
        console.log('✅ Profile saved successfully:', savedProfile._id);

        // Update user's profileCompleted status
        await User.findByIdAndUpdate(req.user.id, {
            profileCompleted: savedProfile.profileCompleted
        });
        console.log('✅ User profileCompleted status updated');

        const completionPercentage = savedProfile.calculateCompletion();

        res.json({
            success: true,
            message: 'Profile saved successfully',
            profile: savedProfile,
            completionPercentage
        });

    } catch (error) {
        console.error('❌ Save profile error:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error while saving profile',
            error: error.message
        });
    }
});

// @desc    Create or update user profile
// @route   POST /api/profile
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            personalInfo,
            academicInfo,
            skills,
            careerPreferences,
            resumeInfo
        } = req.body;

        // Find existing profile or create new one
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            // Update existing profile
            profile.personalInfo = { ...profile.personalInfo, ...personalInfo };
            profile.academicInfo = { ...profile.academicInfo, ...academicInfo };
            profile.skills = { ...profile.skills, ...skills };
            profile.careerPreferences = { ...profile.careerPreferences, ...careerPreferences };
            profile.resumeInfo = { ...profile.resumeInfo, ...resumeInfo };
        } else {
            // Create new profile
            profile = new Profile({
                user: req.user.id,
                personalInfo,
                academicInfo,
                skills,
                careerPreferences,
                resumeInfo
            });
        }

        await profile.save();

        // Update user's profileCompleted status
        await User.findByIdAndUpdate(req.user.id, {
            profileCompleted: profile.profileCompleted
        });

        const completionPercentage = profile.calculateCompletion();

        res.json({
            success: true,
            message: 'Profile saved successfully',
            profile,
            completionPercentage
        });

    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while saving profile'
        });
    }
});

// @desc    Upload resume
// @route   POST /api/profile/upload-resume
// @access  Private
router.post('/upload-resume', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const resumeData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        // Update profile with resume info
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            profile.resumeInfo.resumeFile = resumeData;
        } else {
            profile = new Profile({
                user: req.user.id,
                resumeInfo: {
                    resumeFile: resumeData
                }
            });
        }

        await profile.save();

        res.json({
            success: true,
            message: 'Resume uploaded successfully',
            resume: resumeData
        });

    } catch (error) {
        console.error('Upload resume error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while uploading resume'
        });
    }
});

// @desc    Update profile section
// @route   PATCH /api/profile/section/:sectionName
// @access  Private
router.patch('/section/:sectionName', authMiddleware, async (req, res) => {
    try {
        const { sectionName } = req.params;
        const sectionData = req.body;

        let profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            profile = new Profile({
                user: req.user.id
            });
        }

        // Update specific section
        switch (sectionName) {
            case 'personal':
                profile.personalInfo = { ...profile.personalInfo, ...sectionData };
                break;
            case 'academic':
                profile.academicInfo = { ...profile.academicInfo, ...sectionData };
                break;
            case 'skills':
                profile.skills = { ...profile.skills, ...sectionData };
                break;
            case 'career':
                profile.careerPreferences = { ...profile.careerPreferences, ...sectionData };
                break;
            case 'resume':
                profile.resumeInfo = { ...profile.resumeInfo, ...sectionData };
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid section name'
                });
        }

        await profile.save();

        const completionPercentage = profile.calculateCompletion();

        res.json({
            success: true,
            message: `${sectionName} section updated successfully`,
            profile,
            completionPercentage
        });

    } catch (error) {
        console.error('Update section error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile section'
        });
    }
});

// @desc    Get profile completion status
// @route   GET /api/profile/completion
// @access  Private
router.get('/completion', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.json({
                success: true,
                completionPercentage: 0,
                completionStatus: {
                    personal: false,
                    academic: false,
                    skills: false,
                    career: false,
                    resume: false
                }
            });
        }

        const completionPercentage = profile.calculateCompletion();

        res.json({
            success: true,
            completionPercentage,
            completionStatus: profile.completionStatus
        });

    } catch (error) {
        console.error('Get completion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching completion status'
        });
    }
});

// @desc    Delete profile
// @route   DELETE /api/profile
// @access  Private
router.delete('/', authMiddleware, async (req, res) => {
    try {
        await Profile.findOneAndDelete({ user: req.user.id });
        
        // Reset user's profileCompleted status
        await User.findByIdAndUpdate(req.user.id, {
            profileCompleted: false
        });

        res.json({
            success: true,
            message: 'Profile deleted successfully'
        });

    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting profile'
        });
    }
});

module.exports = router;