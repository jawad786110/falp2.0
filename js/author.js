console.log('Author.js loaded');
import {
    auth, db,
    onAuthStateChanged,
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy
} from './firebase-config.js';
import { uploadToCloudinary } from './cloudinary-config.js';
import { initAuthNav } from './nav-auth.js';

let currentUser = null;
let allPosts = [];
let currentFilter = 'all';
let editingPostId = null;

// DOM Elements
const userName = document.getElementById('user-name');
const postsList = document.getElementById('posts-list');
const createPostBtn = document.getElementById('create-post-btn');
const postModal = document.getElementById('post-modal');
const postForm = document.getElementById('post-form');
const cancelBtn = document.getElementById('cancel-btn');
const imageInput = document.getElementById('image-file');
const imgPreview = document.getElementById('img-preview');
const saveDraftBtn = document.getElementById('save-draft-btn');
const submitReviewBtn = document.getElementById('submit-review-btn');
const statusMsg = document.getElementById('status-msg');

// Stats elements
const statTotal = document.getElementById('stat-total');
const statPublished = document.getElementById('stat-published');
const statPending = document.getElementById('stat-pending');
const statDrafts = document.getElementById('stat-drafts');

// Filter buttons
const filterAll = document.getElementById('filter-all');
const filterPublished = document.getElementById('filter-published');
const filterPending = document.getElementById('filter-pending');
const filterDrafts = document.getElementById('filter-drafts');

// Initialize
async function init() {
    initAuthNav();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            userName.textContent = user.displayName || 'Author';
            await loadUserPosts();
        } else {
            window.location.href = 'auth.html';
        }
    });
}

// Load user's posts
async function loadUserPosts() {
    try {
        const q = query(
            collection(db, "posts"),
            where("authorId", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        allPosts = [];

        querySnapshot.forEach((doc) => {
            allPosts.push({ id: doc.id, ...doc.data() });
        });

        updateStats();
        renderPosts();

    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<div class="empty-state"><h3>Error loading posts</h3><p>' + error.message + '</p></div>';
    }
}

// Update stats
function updateStats() {
    const total = allPosts.length;
    const published = allPosts.filter(p => p.status === 'published').length;
    const pending = allPosts.filter(p => p.status === 'pending').length;
    const drafts = allPosts.filter(p => p.status === 'draft').length;

    statTotal.textContent = total;
    statPublished.textContent = published;
    statPending.textContent = pending;
    statDrafts.textContent = drafts;
}

// Render posts
function renderPosts() {
    let filteredPosts = allPosts;

    if (currentFilter !== 'all') {
        filteredPosts = allPosts.filter(p => p.status === currentFilter);
    }

    if (filteredPosts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <h3>No ${currentFilter === 'all' ? '' : currentFilter + ' '}posts yet</h3>
                <p>Click "Create New Post" to get started!</p>
            </div>
        `;
        return;
    }

    postsList.innerHTML = filteredPosts.map(post => `
        <div class="post-row">
            <div class="post-title">${post.title}</div>
            <div>${post.category}</div>
            <div><span class="status-badge status-${post.status}">${post.status}</span></div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${post.date}</div>
            <div class="post-actions">
                <button class="action-btn" onclick="editPost('${post.id}')">Edit</button>
                <button class="action-btn" onclick="deletePost('${post.id}')" style="color: #ef4444;">Delete</button>
            </div>
        </div>
    `).join('');
}

// Create post button
createPostBtn.addEventListener('click', () => {
    editingPostId = null;
    document.getElementById('modal-title').textContent = 'Create New Post';
    postForm.reset();
    imgPreview.style.display = 'none';
    postModal.classList.add('active');
});

// Cancel button
cancelBtn.addEventListener('click', () => {
    postModal.classList.remove('active');
});

// Image preview
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showStatus('Image size must be less than 5MB. Please choose a smaller image.', false);
            imageInput.value = '';
            imgPreview.style.display = 'none';
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showStatus('Please upload a JPG or PNG image.', false);
            imageInput.value = '';
            imgPreview.style.display = 'none';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Character counting
const titleInput = document.getElementById('title');
const excerptInput = document.getElementById('excerpt');
const contentInput = document.getElementById('content');
const titleCount = document.getElementById('title-count');
const excerptCount = document.getElementById('excerpt-count');
const contentCount = document.getElementById('content-count');

if (titleInput && titleCount) {
    titleInput.addEventListener('input', () => {
        titleCount.textContent = titleInput.value.length;
    });
}

if (excerptInput && excerptCount) {
    excerptInput.addEventListener('input', () => {
        excerptCount.textContent = excerptInput.value.length;
    });
}

if (contentInput && contentCount) {
    contentInput.addEventListener('input', () => {
        contentCount.textContent = contentInput.value.length;
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (postModal.classList.contains('active')) {
            saveDraftBtn.click();
        }
    }
    // Escape to close modal
    if (e.key === 'Escape' && postModal.classList.contains('active')) {
        postModal.classList.remove('active');
    }
});


// Form submission - Save as Draft
saveDraftBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await savePost('draft');
});

// Form submission - Submit for Review
submitReviewBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await savePost('pending');
});


// Save post function
async function savePost(status) {
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const readTime = document.getElementById('readTime').value.trim();
    const excerpt = document.getElementById('excerpt').value.trim();
    const content = document.getElementById('content').value.trim();
    const imageFile = imageInput.files[0];

    // Client-side validation
    if (!title || title.length < 3) {
        showStatus('Title must be at least 3 characters long.', false);
        return;
    }

    if (!excerpt || excerpt.length < 10) {
        showStatus('Excerpt must be at least 10 characters long.', false);
        return;
    }

    if (!content || content.length < 100) {
        showStatus('Content must be at least 100 characters long.', false);
        return;
    }

    // Validate read time format
    const readTimePattern = /^\d+\s*min\s*read$/i;
    if (!readTimePattern.test(readTime)) {
        showStatus('Read time must be in format "X min read" (e.g., "5 min read")', false);
        return;
    }

    try {
        setLoading(true);

        let imageUrl = null;

        // Handle image upload
        if (imageFile) {
            try {
                showStatus('Uploading image to Cloudinary...', true);
                imageUrl = await uploadToCloudinary(imageFile);
                showStatus('Image uploaded successfully!', true);
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                showStatus('❌ Image upload failed: ' + uploadError.message + '. Please try again.', false);
                setLoading(false);
                return; // Stop - don't save post without image
            }
        } else if (editingPostId) {
            // Keep existing image if editing and no new image selected
            const existingPost = allPosts.find(p => p.id === editingPostId);
            imageUrl = existingPost?.image;
        } else {
            // New post requires an image
            showStatus('Please select a feature image for your post.', false);
            setLoading(false);
            return;
        }

        const postData = {
            title,
            category,
            readTime,
            excerpt,
            content,
            image: imageUrl,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Anonymous',
            status: status,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            updatedAt: Date.now()
        };

        if (editingPostId) {
            // Update existing post
            await updateDoc(doc(db, "posts", editingPostId), postData);
            showStatus('Post updated successfully!', true);
        } else {
            // Create new post
            await addDoc(collection(db, "posts"), postData);
            showStatus(status === 'draft' ? 'Draft saved!' : 'Submitted for review!', true);
        }

        setTimeout(() => {
            postModal.classList.remove('active');
            loadUserPosts();
        }, 1500);

    } catch (error) {
        console.error('Error saving post:', error);
        showStatus('Error: ' + error.message, false);
    } finally {
        setLoading(false);
    }
}

// Edit post
window.editPost = async (postId) => {
    editingPostId = postId;
    const post = allPosts.find(p => p.id === postId);

    if (!post) return;

    document.getElementById('modal-title').textContent = 'Edit Post';
    document.getElementById('title').value = post.title;
    document.getElementById('category').value = post.category;
    document.getElementById('readTime').value = post.readTime;
    document.getElementById('excerpt').value = post.excerpt;
    document.getElementById('content').value = post.content;

    if (post.image) {
        imgPreview.src = post.image;
        imgPreview.style.display = 'block';
    }

    postModal.classList.add('active');
};

// Delete post
window.deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        await deleteDoc(doc(db, "posts", postId));
        await loadUserPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post: ' + error.message);
    }
};

// Filter buttons
filterAll.addEventListener('click', () => {
    currentFilter = 'all';
    updateFilterButtons();
    renderPosts();
});

filterPublished.addEventListener('click', () => {
    currentFilter = 'published';
    updateFilterButtons();
    renderPosts();
});

filterPending.addEventListener('click', () => {
    currentFilter = 'pending';
    updateFilterButtons();
    renderPosts();
});

filterDrafts.addEventListener('click', () => {
    currentFilter = 'draft';
    updateFilterButtons();
    renderPosts();
});

function updateFilterButtons() {
    [filterAll, filterPublished, filterPending, filterDrafts].forEach(btn => {
        btn.classList.remove('active');
    });

    if (currentFilter === 'all') filterAll.classList.add('active');
    else if (currentFilter === 'published') filterPublished.classList.add('active');
    else if (currentFilter === 'pending') filterPending.classList.add('active');
    else if (currentFilter === 'draft') filterDrafts.classList.add('active');
}

// Helper functions
function setLoading(isLoading) {
    saveDraftBtn.disabled = isLoading;
    submitReviewBtn.disabled = isLoading;

    if (isLoading) {
        saveDraftBtn.textContent = 'Saving...';
        submitReviewBtn.textContent = 'Submitting...';
    } else {
        saveDraftBtn.textContent = 'Save as Draft';
        submitReviewBtn.textContent = 'Submit for Review';
    }
}

function showStatus(message, isSuccess) {
    statusMsg.textContent = message;
    statusMsg.style.display = 'block';
    statusMsg.className = isSuccess ? 'success-msg' : 'error-msg';
    statusMsg.style.padding = '0.75rem';
    statusMsg.style.borderRadius = '8px';
    statusMsg.style.marginTop = '1rem';
}

// Initialize filter buttons
updateFilterButtons();

// Initialize app
init();
