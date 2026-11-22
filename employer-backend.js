const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "farmer-aed8f",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
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
app.post('/api/jobs', async (req, res) => {
  try {
    const jobData = req.body;
    
    // Generate unique ID for the job
    const jobId = db.ref().child('jobs').push().key;
    
    const jobWithMetadata = {
      ...jobData,
      id: jobId,
      createdAt: new Date().toISOString(),
      status: 'active',
      applicants: [],
      aiMatches: [],
      company: jobData.company || 'Tech Solutions Inc.',
      postedBy: jobData.postedBy || 'Employer User',
      type: jobData.type || 'job' // 'job' or 'internship'
    };
    
    // Save to Firebase under both jobs and opportunities
    await db.ref('jobs/' + jobId).set(jobWithMetadata);
    await db.ref('opportunities/' + jobId).set(jobWithMetadata);
    
    res.json({
      success: true,
      message: 'Job posting created successfully',
      jobId: jobId,
      data: jobWithMetadata
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const snapshot = await db.ref('jobs').get();
    const jobs = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        jobs.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
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

// New endpoint to get opportunities for students
app.get('/api/opportunities', async (req, res) => {
  try {
    const snapshot = await db.ref('opportunities').get();
    const opportunities = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        opportunities.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const updates = req.body;
    
    // Update both jobs and opportunities
    await db.ref('jobs/' + jobId).update(updates);
    await db.ref('opportunities/' + jobId).update(updates);
    
    res.json({
      success: true,
      message: 'Job posting updated successfully'
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Delete from both jobs and opportunities
    await db.ref('jobs/' + jobId).remove();
    await db.ref('opportunities/' + jobId).remove();
    
    res.json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job posting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const snapshot = await db.ref('students').get();
    const students = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        students.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve the employer dashboard
app.get('/employer', (req, res) => {
  res.sendFile(path.join(__dirname, 'employer-dashboard.html'));
});

// Serve the student dashboard
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'student-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Employer backend server running on http://localhost:${PORT}`);
  console.log('Firebase integration is ready!');
});