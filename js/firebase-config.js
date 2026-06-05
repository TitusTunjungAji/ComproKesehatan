// ============================================
// DENTAVIZION — Firebase Configuration
// Shared module for Auth, Firestore, Storage
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYbIrARNnX57RziZR-iKJndPmuqTSvUN8",
  authDomain: "dentavizion-ceae8.firebaseapp.com",
  projectId: "dentavizion-ceae8",
  storageBucket: "dentavizion-ceae8.firebasestorage.app",
  messagingSenderId: "206450989836",
  appId: "1:206450989836:web:593df7ed39381e766b0729",
  measurementId: "G-FFGC91YJCH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ── Auth Helpers ──
async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function logoutUser() {
  await signOut(auth);
  // Clear all local storage data related to dentavizion to reset modules, streak, etc.
  const keysToClear = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('dentavizion-')) {
      keysToClear.push(key);
    }
  }
  keysToClear.forEach(k => localStorage.removeItem(k));
}

function getCurrentUser() {
  return auth.currentUser;
}

function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Firestore Helpers ──
async function saveUserProfile(userId, data) {
  await setDoc(doc(db, 'users', userId), data, { merge: true });
}

async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

async function saveReport(reportData) {
  const userEmail = reportData.userEmail;
  if (!userEmail) throw new Error('userEmail is required');

  // Structure: reports/{userEmail}/entries/{timestamp}
  // First ensure the parent doc exists
  await setDoc(doc(db, 'reports', userEmail), { 
    lastUpdated: serverTimestamp() 
  }, { merge: true });

  // Add report entry as subcollection
  return await addDoc(collection(db, 'reports', userEmail, 'entries'), {
    userId: reportData.userId,
    photoURL: reportData.photoURL || null,
    date: reportData.date,
    time: reportData.time,
    notes: reportData.notes || '',
    createdAt: serverTimestamp()
  });
}

async function getUserReports(userEmail) {
  const snap = await getDocs(collection(db, 'reports', userEmail, 'entries'));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort by createdAt descending (newest first)
  results.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return tb - ta;
  });
  return results;
}

// ── Storage Helpers ──
async function uploadPhoto(path, file) {
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, file);
  return await getDownloadURL(snap.ref);
}

async function uploadProfilePhoto(userId, file) {
  return await uploadPhoto(`profiles/${userId}/avatar.jpg`, file);
}

async function uploadReportPhoto(userId, file) {
  const timestamp = Date.now();
  return await uploadPhoto(`reports/${userId}/${timestamp}.jpg`, file);
}

// Export everything
export {
  auth, db, storage,
  loginUser, registerUser, logoutUser, getCurrentUser, onUserChanged,
  saveUserProfile, getUserProfile,
  saveReport, getUserReports,
  uploadPhoto, uploadProfilePhoto, uploadReportPhoto
};
