// Firebase web config for the training-log project.
//
// Safe to commit: the apiKey is identifies the Firebase project, not a secret —
// Firestore rules are what gate access (currently wide-open by design for this
// single-user personal log). See README "Firebase setup" for details.

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-4JUhYxAkzWRSDfxIUxQSdaA_el7g84k",
  authDomain: "training-log-225de.firebaseapp.com",
  projectId: "training-log-225de",
  storageBucket: "training-log-225de.firebasestorage.app",
  messagingSenderId: "456070794822",
  appId: "1:456070794822:web:b8a2f8c2c16e0519ec8447",
};

export const isFirebaseConfigured = () => !!FIREBASE_CONFIG.projectId;
