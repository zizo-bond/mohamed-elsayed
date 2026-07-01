/**
 * Firebase Config and Initialization Boilerplate
 * Location: /vanilla-vercel/firebase-config.js
 * 
 * Configured specifically for:
 * - Firebase Authentication
 * - Cloud Firestore
 */

// Paste your actual Firebase configuration here
const firebaseConfig = {
  apiKey: "AIzaSyBI55vGsSXvARv-Y4nKhaxgB8-8nQrU2r8",
  authDomain: "gen-lang-client-0446040294.firebaseapp.com",
  projectId: "gen-lang-client-0446040294",
  storageBucket: "gen-lang-client-0446040294.firebasestorage.app",
  messagingSenderId: "1067224146338",
  appId: "1:1067224146338:web:8a5bf85ca1adb83a3b92fb"
};

// Initialize Firebase using global CDN script elements
const app = firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();

// Initialize Firestore (utilizing custom Database ID)
const db = firebase.firestore();
// Configure custom database ID
db.useDatabase("ai-studio-mohamedalsayedab-e3c83435-3653-4f4b-adae-98b60f23984f");
