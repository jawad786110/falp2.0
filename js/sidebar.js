// Sidebar navigation handler
import { auth, onAuthStateChanged } from './firebase-config.js';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarProfile = document.getElementById('sidebar-profile');
const sidebarFooter = document.getElementById('sidebar-footer');
const profileAvatar = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const profileRole = document.getElementById('profile-role');
const dashboardLink = document.getElementById('dashboard-link');
const adminLink = document.getElementById('admin-link');
const authLink = document.getElementById('auth-link');
const sidebarLogout = document.getElementById('sidebar-logout');

// Toggle sidebar on mobile
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-active');
        sidebarOverlay.classList.toggle('active');
    });
}

// Close sidebar when clicking overlay
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-active');
        sidebarOverlay.classList.remove('active');
    });
}

// Set active link based on current page
function setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar-nav a');

    links.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Initialize auth state
async function initSidebarAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in
            try {
                const { db, doc, getDoc } = await import('./firebase-config.js');
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                let role = 'author';
                if (userDocSnap.exists()) {
                    role = userDocSnap.data().role || 'author';
                }

                // Show profile section
                sidebarProfile.classList.add('active');
                profileAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=d97706&color=fff`;
                profileName.textContent = user.displayName || 'User';
                profileRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);

                // Show appropriate dashboard link
                if (role === 'admin') {
                    dashboardLink.style.display = 'block';
                    dashboardLink.querySelector('a').href = 'admin-dashboard.html';
                    adminLink.style.display = 'block';
                } else {
                    dashboardLink.style.display = 'block';
                    dashboardLink.querySelector('a').href = 'author-dashboard.html';
                    adminLink.style.display = 'none';
                }

                // Hide login link, show logout
                authLink.style.display = 'none';
                sidebarFooter.style.display = 'block';

            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        } else {
            // User is not logged in
            sidebarProfile.classList.remove('active');
            dashboardLink.style.display = 'none';
            adminLink.style.display = 'none';
            authLink.style.display = 'block';
            sidebarFooter.style.display = 'none';
        }
    });
}

// Logout handler
if (sidebarLogout) {
    sidebarLogout.addEventListener('click', async () => {
        try {
            const { signOut } = await import('./firebase-config.js');
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    });
}

// Initialize
setActiveLink();
initSidebarAuth();

// Export for use in other modules
export { initSidebarAuth };
