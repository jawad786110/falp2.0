console.log('Admin Dashboard JS loaded');
import {
    auth, db,
    onAuthStateChanged,
    collection, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy
} from './firebase-config.js';
import { initAuthNav } from './nav-auth.js';

let currentUser = null;
let allPosts = [];
let currentTab = 'pending';
let postToReject = null;

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const statPending = document.getElementById('stat-pending');
const statPublished = document.getElementById('stat-published');
const statRejected = document.getElementById('stat-rejected');
const statTotal = document.getElementById('stat-total');
const rejectionModal = document.getElementById('rejection-modal');
const rejectionReason = document.getElementById('rejection-reason');
const confirmRejectBtn = document.getElementById('confirm-reject-btn');
const cancelRejectBtn = document.getElementById('cancel-reject-btn');

// Initialize
async function init() {
    initAuthNav();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Check if user is admin
            const { getDoc } = await import('./firebase-config.js');
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                currentUser = user;
                await loadAllPosts();
            } else {
                // Not an admin, redirect to author dashboard
                window.location.href = 'author-dashboard.html';
            }
        } else {
            window.location.href = 'auth.html';
        }
    });
}

// Load all posts
async function loadAllPosts() {
    try {
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        allPosts = [];
        querySnapshot.forEach((doc) => {
            allPosts.push({ id: doc.id, ...doc.data() });
        });

        updateStats();
        renderPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="empty-state"><h3>Error loading posts</h3><p>' + error.message + '</p></div>';
    }
}

// Update stats
function updateStats() {
    const pending = allPosts.filter(p => p.status === 'pending').length;
    const published = allPosts.filter(p => p.status === 'published').length;
    const rejected = allPosts.filter(p => p.status === 'rejected').length;
    const total = allPosts.length;

    statPending.textContent = pending;
    statPublished.textContent = published;
    statRejected.textContent = rejected;
    statTotal.textContent = total;
}

// Render posts
function renderPosts() {
    let filteredPosts = allPosts;

    if (currentTab === 'pending') {
        filteredPosts = allPosts.filter(p => p.status === 'pending');
    } else if (currentTab === 'published') {
        filteredPosts = allPosts.filter(p => p.status === 'published');
    }

    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No ${currentTab} posts</h3>
                <p>${currentTab === 'pending' ? 'All caught up! No posts awaiting review.' : 'No posts in this category.'}</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = filteredPosts.map(post => `
        <div class="post-review-card glass">
            <div class="post-thumbnail" style="background-image: url('${post.image || 'https://via.placeholder.com/150x100?text=No+Image'}')"></div>
            <div class="post-info">
                <h3>${post.title}</h3>
                <div class="post-meta">
                    <span>📝 ${post.authorName || 'Unknown'}</span>
                    <span>📅 ${post.date}</span>
                    <span>📂 ${post.category}</span>
                    <span class="status-badge status-${post.status}">${post.status}</span>
                </div>
                <p class="post-excerpt">${post.excerpt || 'No excerpt available'}</p>
                ${post.rejectionReason ? `<p style="color: #ef4444; font-size: 0.85rem; margin-top: 0.5rem;">❌ Rejection reason: ${post.rejectionReason}</p>` : ''}
            </div>
            <div class="post-actions">
                ${post.status === 'pending' ? `
                    <button class="approve-btn" onclick="approvePost('${post.id}')">✓ Approve</button>
                    <button class="reject-btn" onclick="showRejectModal('${post.id}')">✗ Reject</button>
                ` : ''}
                ${post.status === 'published' ? `
                    <button class="reject-btn" onclick="unpublishPost('${post.id}')">Unpublish</button>
                ` : ''}
                ${post.status === 'rejected' ? `
                    <button class="approve-btn" onclick="approvePost('${post.id}')">✓ Approve</button>
                ` : ''}
                <button class="filter-btn" onclick="deletePost('${post.id}')" style="color: #ef4444; border-color: #ef4444;">Delete</button>
            </div>
        </div>
    `).join('');
}

// Approve post
window.approvePost = async (postId) => {
    try {
        await updateDoc(doc(db, "posts", postId), {
            status: 'published',
            publishedAt: Date.now(),
            rejectionReason: null
        });
        await loadAllPosts();
        alert('Post approved and published! ✅');
    } catch (error) {
        console.error('Error approving post:', error);
        alert('Error: ' + error.message);
    }
};

// Show reject modal
window.showRejectModal = (postId) => {
    postToReject = postId;
    rejectionReason.value = '';
    rejectionModal.classList.add('active');
};

// Confirm rejection
confirmRejectBtn.addEventListener('click', async () => {
    if (!postToReject) return;

    try {
        await updateDoc(doc(db, "posts", postToReject), {
            status: 'rejected',
            rejectionReason: rejectionReason.value || 'No reason provided',
            rejectedAt: Date.now()
        });

        rejectionModal.classList.remove('active');
        await loadAllPosts();
        alert('Post rejected. Author has been notified. ❌');
    } catch (error) {
        console.error('Error rejecting post:', error);
        alert('Error: ' + error.message);
    }
});

// Cancel rejection
cancelRejectBtn.addEventListener('click', () => {
    rejectionModal.classList.remove('active');
    postToReject = null;
});

// Unpublish post
window.unpublishPost = async (postId) => {
    if (!confirm('Unpublish this post?')) return;

    try {
        await updateDoc(doc(db, "posts", postId), {
            status: 'draft'
        });
        await loadAllPosts();
        alert('Post unpublished ⏸️');
    } catch (error) {
        console.error('Error unpublishing post:', error);
        alert('Error: ' + error.message);
    }
};

// Delete post
window.deletePost = async (postId) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;

    try {
        await deleteDoc(doc(db, "posts", postId));
        await loadAllPosts();
        alert('Post deleted permanently 🗑️');
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error: ' + error.message);
    }
};

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderPosts();
    });
});

// Initialize
init();
