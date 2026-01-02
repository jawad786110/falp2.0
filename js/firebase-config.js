// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, deleteDoc, orderBy, query, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// TODO: Replace the following with your app's Firebase project configuration
// You can find these in the Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "AIzaSyCQMeT5Qv3mJLFryqzHUN0XDSFbuoCz5fc",
    authDomain: "university-blog-site.firebaseapp.com",
    projectId: "university-blog-site",
    storageBucket: "university-blog-site.firebasestorage.app",
    messagingSenderId: "228884205086",
    appId: "1:228884205086:web:f5a84dc315f6ab948ba80f",
    measurementId: "G-SJKM044GJQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export {
    db, storage, auth,
    collection, addDoc, getDocs, getDoc, doc, deleteDoc, orderBy, query, setDoc, updateDoc, where,
    ref, uploadBytes, getDownloadURL,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile,
    GoogleAuthProvider, signInWithPopup
};
