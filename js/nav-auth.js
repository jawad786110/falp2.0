// Shared navigation auth handler
// This file handles the authentication state in the navigation across all pages

import { auth, onAuthStateChanged } from './firebase-config.js';

export function initAuthNav() {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in
            const userProfile = await getUserProfile(user.uid);
            const role = userProfile?.role || 'author';
            const dashboardUrl = role === 'admin' ? 'admin-dashboard.html' : 'author-dashboard.html';

            authNav.innerHTML = `
                <div class="user-menu" style="position: relative;">
                    <button class="user-avatar-btn" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); border-radius: 50px; padding: 0.4rem 1rem 0.4rem 0.4rem; cursor: pointer;">
                        <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=d97706&color=fff`}" 
                             alt="User" 
                             style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                        <span style="color: var(--text-main); font-weight: 500;">${user.displayName || 'User'}</span>
                    </button>
                    <div class="user-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px; padding: 0.5rem; min-width: 180px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 1000;">
                        <a href="${dashboardUrl}" style="display: block; padding: 0.75rem 1rem; color: var(--text-main); text-decoration: none; border-radius: 8px; transition: background 0.3s;">
                            📊 Dashboard
                        </a>
                        ${role === 'admin' ? '<a href="admin-dashboard.html" style="display: block; padding: 0.75rem 1rem; color: var(--text-main); text-decoration: none; border-radius: 8px; transition: background 0.3s;">👑 Admin Panel</a>' : ''}
                        <a href="#" id="logout-btn" style="display: block; padding: 0.75rem 1rem; color: #ef4444; text-decoration: none; border-radius: 8px; transition: background 0.3s; border-top: 1px solid var(--glass-border); margin-top: 0.5rem; padding-top: 0.75rem;">
                            🚪 Logout
                        </a>
                    </div>
                </div>
            `;

            // Dropdown toggle
            const avatarBtn = authNav.querySelector('.user-avatar-btn');
            const dropdown = authNav.querySelector('.user-dropdown');

            avatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });

            // Hover effects
            authNav.querySelectorAll('.user-dropdown a').forEach(link => {
                link.addEventListener('mouseenter', (e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                });
                link.addEventListener('mouseleave', (e) => {
                    e.target.style.background = 'transparent';
                });
            });

            // Logout handler
            const logoutBtn = authNav.querySelector('#logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
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

        } else {
            // User is not logged in
            authNav.innerHTML = `
                <a href="auth.html" class="primary-btn" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;">Login</a>
            `;
        }
    });
}

async function getUserProfile(uid) {
    try {
        const { db, doc, getDoc } = await import('./firebase-config.js');
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}
