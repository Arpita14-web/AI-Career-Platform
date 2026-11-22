// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Your web app's Firebase configuration
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


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Firebase functions for frontend
window.firebaseApp = {
  saveProfile: async (profileData) => {
    try {
      const userId = profileData.email || 'default-user';
      await set(ref(database, 'students/' + userId), {
        ...profileData,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  loadProfile: async (userId) => {
    try {
      const snapshot = await get(child(ref(database), 'students/' + userId));
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: false, error: 'No data found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};