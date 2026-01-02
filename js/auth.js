console.log('Auth.js loaded');
import {
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setDoc, doc,
    GoogleAuthProvider, signInWithPopup
} from './firebase-config.js';

// DOM Elements
const loginTab = document.querySelector('[data-tab="login"]');
const signupTab = document.querySelector('[data-tab="signup"]');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMsg = document.getElementById('error-msg');
const successMsg = document.getElementById('success-msg');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// Tab Switching
const tabs = document.querySelectorAll('.auth-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active form
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        if (targetTab === 'login') {
            loginForm.classList.add('active');
        } else {
            signupForm.classList.add('active');
        }

        // Clear messages
        hideMessages();
    });
});

// Role is always "author" for public signups - admins are created manually

// GOOGLE SIGN-IN
const googleSignInBtn = document.getElementById('google-signin-btn');
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user profile exists
            const { getDoc } = await import('./firebase-config.js');
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // Create new user profile (always as author)
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'User',
                    role: 'author', // Google signups are always authors
                    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=d97706&color=fff`,
                    createdAt: Date.now(),
                    bio: ""
                });
            }

            const userProfile = userDocSnap.exists() ? userDocSnap.data() : { role: 'author' };

            showSuccess('Signed in successfully! Redirecting...');

            setTimeout(() => {
                if (userProfile.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'author-dashboard.html';
                }
            }, 1000);

        } catch (error) {
            console.error('Google sign-in error:', error);
            showError(error.message || 'Failed to sign in with Google');
        }
    });
}


// LOGIN HANDLER
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        setLoading(loginBtn, true);
        hideMessages();

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user role from Firestore
        const userDoc = await getUserProfile(user.uid);

        showSuccess('Login successful! Redirecting...');

        // Redirect based on role
        setTimeout(() => {
            if (userDoc && userDoc.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'author-dashboard.html';
            }
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showError(getErrorMessage(error.code));
    } finally {
        setLoading(loginBtn, false);
    }
});

// SIGNUP HANDLER
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = 'author'; // All public signups are authors only

    try {
        setLoading(signupBtn, true);
        hideMessages();

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, {
            displayName: name
        });

        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            displayName: name,
            role: role,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d97706&color=fff`,
            createdAt: Date.now(),
            bio: ""
        });

        showSuccess('Account created successfully! Redirecting...');

        // All new signups go to author dashboard
        setTimeout(() => {
            window.location.href = 'author-dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        showError(getErrorMessage(error.code));
    } finally {
        setLoading(signupBtn, false);
    }
});

// Helper Functions
async function getUserProfile(uid) {
    try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await (await import('./firebase-config.js')).getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

function setLoading(button, isLoading) {
    button.disabled = isLoading;
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Processing...';
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    successMsg.style.display = 'none';
}

function showSuccess(message) {
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
}

function hideMessages() {
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid email or password.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}
