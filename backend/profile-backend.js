const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAyqsO4KBk6_Z5ZVWCfFRILY6o02s43u3s",
  authDomain: "farmer-aed8f.firebaseapp.com",
  databaseURL: "https://farmer-aed8f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farmer-aed8f",
  storageBucket: "farmer-aed8f.firebasestorage.app",
  messagingSenderId: "73514618788",
  appId: "1:73514618788:web:a1b8d30417371ebf38fb31",
  measurementId: "G-M36P2R8JRR"
};


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://farmer-aed8f-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.post('/api/save-profile', async (req, res) => {
  try {
    const profileData = req.body;
    const userId = profileData.email || 'default-user';
    
    // Save to Firebase
    await db.ref('students/' + userId).set({
      ...profileData,
      lastUpdated: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Profile saved successfully',
      userId: userId
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/get-profile/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const snapshot = await db.ref('students/' + userId).get();
    
    if (snapshot.exists()) {
      res.json({
        success: true,
        data: snapshot.val()
      });
    } else {
      res.json({
        success: false,
        error: 'Profile not found'
      });
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    // Sample job data - you can expand this
    const jobs = [
      {
        id: '1',
        jobTitle: 'AI Research Intern',
        companyName: 'Tech Solutions Inc.',
        postingType: 'internship',
        location: 'Bhubaneswar',
        requiredSkills: ['Python', 'Machine Learning', 'Data Analysis'],
        salary: '₹25,000/month',
        duration: '6 months'
      },
      {
        id: '2',
        jobTitle: 'Data Science Intern',
        companyName: 'Data Analytics Pro',
        postingType: 'internship',
        location: 'remote',
        requiredSkills: ['Python', 'SQL', 'Statistics'],
        salary: '₹20,000/month',
        duration: '3 months'
      },
      {
        id: '3',
        jobTitle: 'Machine Learning Engineer',
        companyName: 'AI Tech Solutions',
        postingType: 'job',
        location: 'Bangalore',
        requiredSkills: ['Python', 'TensorFlow', 'Deep Learning'],
        salary: '₹12-18 LPA',
        duration: 'Full-time'
      }
    ];
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/jobs/:jobId/apply', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.body.userId || 'default-user';
    
    // Save application to Firebase
    await db.ref('applications/' + jobId + '/' + userId).set({
      appliedAt: new Date().toISOString(),
      status: 'pending'
    });
    
    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Firebase backend is ready!');
});