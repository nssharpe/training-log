// Paste your Firebase web config object here after creating a project at
// https://console.firebase.google.com — pick "Add app → Web (</>)" to copy it.
//
// Until you fill this in, the app runs in localStorage-only mode (still
// fully usable on one device — just no cross-device sync).
//
// Setup steps (see README for screenshots):
//   1. Create Firebase project. No Google Analytics needed.
//   2. Build → Firestore Database → Create database → Start in production mode.
//   3. Firestore → Rules tab → paste:
//        rules_version = '2';
//        service cloud.firestore {
//          match /databases/{database}/documents {
//            match /{document=**} { allow read, write: if true; }
//          }
//        }
//   4. Project settings ⚙ → "Your apps" → register a Web app → copy the config object below.

export const FIREBASE_CONFIG = {
  // apiKey: "AIza...",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "...",
  // appId: "1:...:web:...",
};

export const isFirebaseConfigured = () => !!FIREBASE_CONFIG.projectId;
