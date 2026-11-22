const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

console.log('✅ Job routes file loaded successfully');

// Import the Job model
const Job = require('../models/Job');

// SIMPLE TEST ROUTE - Check if routes work
router.get('/test', (req, res) => {
    console.log('✅ /api/jobs/test route hit');
    res.json({
        success: true,
        message: '🎉 Job routes are working perfectly!',
        timestamp: new Date().toISOString(),
        mongoose: {
            connected: mongoose.connection.readyState === 1,
            state: mongoose.STATES[mongoose.connection.readyState]
        }
    });
});

// JOB CREATION - With MongoDB saving
router.post('/', async (req, res) => {
    try {
        console.log('🎯 JOB CREATION ENDPOINT HIT SUCCESSFULLY!');
        console.log('📦 Received data:', req.body);

        const {
            postingType,
            department,
            jobTitle,
            jobDescription,
            requiredSkills,
            preferredSkills,
            experienceLevel,
            location,
            enableAI,
            matchSkills,
            matchExperience,
            matchCulture
        } = req.body;

        // Simple validation
        if (!postingType || !jobTitle || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: postingType, jobTitle, jobDescription'
            });
        }

        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            console.log('❌ MongoDB not connected');
            return res.status(500).json({
                success: false,
                message: 'Database connection error'
            });
        }

        console.log('✅ MongoDB connected, creating job in database...');

        // Create job in MongoDB
        const job = await Job.create({
            postingType,
            department: department || 'engineering',
            jobTitle,
            jobDescription,
            requiredSkills: requiredSkills ? requiredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
            preferredSkills: preferredSkills ? preferredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
            experienceLevel: experienceLevel || 'junior',
            location: location || 'remote',
            enableAI: enableAI !== undefined ? enableAI : true,
            aiPreferences: {
                matchSkills: matchSkills !== undefined ? matchSkills : true,
                matchExperience: matchExperience !== undefined ? matchExperience : true,
                matchCulture: matchCulture !== undefined ? matchCulture : true
            },
            createdBy: new mongoose.Types.ObjectId(), // Temporary user ID
            companyName: 'Test Company Inc.', // Temporary company name
            status: 'active'
        });

        console.log('✅ Job saved to MongoDB with ID:', job._id);
        console.log('📊 Job details:', {
            id: job._id,
            title: job.jobTitle,
            type: job.postingType,
            department: job.department,
            skills: job.requiredSkills
        });

        res.status(201).json({
            success: true,
            message: '🎉 Job posting created successfully and saved to database!',
            data: job
        });

    } catch (error) {
        console.error('❌ Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET ALL JOBS - From MongoDB
router.get('/', async (req, res) => {
    try {
        console.log('📥 Getting all jobs from MongoDB...');
        
        const jobs = await Job.find({})
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`✅ Found ${jobs.length} jobs in database`);

        res.json({
            success: true,
            message: `Retrieved ${jobs.length} jobs from database`,
            data: jobs,
            count: jobs.length
        });

    } catch (error) {
        console.error('❌ Error getting jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs: ' + error.message
        });
    }
});

// GET JOB COUNT - Check how many jobs are in database
router.get('/count', async (req, res) => {
    try {
        const count = await Job.countDocuments();
        console.log(`📊 Total jobs in database: ${count}`);
        
        res.json({
            success: true,
            count: count,
            message: `Total jobs in database: ${count}`
        });
    } catch (error) {
        console.error('❌ Error counting jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error counting jobs: ' + error.message
        });
    }
});

// GET JOB BY ID
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            data: job
        });

    } catch (error) {
        console.error('❌ Error getting job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching job'
        });
    }
});

module.exports = router;