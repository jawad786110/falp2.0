console.log('Main.js loaded');
// main.js - Features: Fetch from Firebase, Render, Search, Filter, Pagination, Animation, Post Detail

import { db, collection, getDocs, getDoc, doc, query, orderBy, where } from './firebase-config.js';
import { initSidebarAuth } from './sidebar.js';

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 6;

// DEBUG LOGGING UTILITY
function createDebugOverlay() {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-overlay';
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.width = '300px';
    debugDiv.style.height = '400px';
    debugDiv.style.overflowY = 'scroll';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugDiv.style.color = 'lime';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.padding = '10px';
    debugDiv.style.zIndex = '9999';
    document.body.appendChild(debugDiv);
}

function log(msg) {
    console.log(msg);
    const overlay = document.getElementById('debug-overlay');
    if (overlay) {
        const line = document.createElement('div');
        line.textContent = `> ${msg}`;
        overlay.appendChild(line);
        overlay.scrollTop = overlay.scrollHeight;
    }
}

// Shared Init
async function init() {
    // createDebugOverlay(); // Disabled for production
    // log('Init started...');

    // Initialize auth navigation
    initSidebarAuth();

    try {
        await loadPosts();

        // Router Logic
        if (document.getElementById('posts-grid')) {
            log('Detected Home Page');
            initHomePage();
        } else if (document.getElementById('post-detail-container')) {
            log('Detected Post Detail Page');
            initPostPage();
        } else {
            log('Unknown Page Context');
        }

    } catch (e) {
        log(`FATAL ERROR: ${e.message}`);
        console.error('Failed to load posts', e);
        // Specific error message for home page if grid exists
        if (document.getElementById('posts-grid')) {
            document.getElementById('posts-grid').innerHTML = '<p style="color:red; text-align:center;">Failed to load content. Please refresh or try again later.</p>';
        }
    }
}

async function loadPosts() {
    log('Fetching from Firebase Firestore...');
    try {
        const q = query(
            collection(db, "posts"),
            where("status", "==", "published"),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);

        allPosts = [];
        querySnapshot.forEach((doc) => {
            allPosts.push({ id: doc.id, ...doc.data() });
        });

        log(`Fetched ${allPosts.length} published posts from Firestore.`);
    } catch (err) {
        log(`Error loading posts: ${err.message}`);
        throw err;
    }
}

// --- HOME PAGE LOGIC ---
function initHomePage() {
    filteredPosts = [...allPosts];
    const searchInput = document.getElementById('search-input');
    const loadMoreBtn = document.getElementById('load-more-btn');

    setupFilters();

    // Search Listener
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Load More Listener
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderPosts();
    });

    renderPosts();
}

function setupFilters() {
    const filterContainer = document.getElementById('category-filters');
    const categories = ['All', ...new Set(allPosts.map(p => p.category))];

    filterContainer.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn glass ${cat === 'All' ? 'active' : ''}`;
        btn.textContent = cat;
        btn.dataset.category = cat;
        btn.setAttribute('aria-pressed', cat === 'All' ? 'true' : 'false');
        btn.addEventListener('click', () => handleFilter(cat, btn));
        filterContainer.appendChild(btn);
    });
}

function handleSearch(query) {
    const term = query.toLowerCase();
    filteredPosts = allPosts.filter(post =>
        post.title.toLowerCase().includes(term) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(term)) ||
        post.author.toLowerCase().includes(term)
    );
    currentPage = 1;
    document.getElementById('posts-grid').innerHTML = '';
    renderPosts();
}

function handleFilter(category, btnElement) {
    const allButtons = document.querySelectorAll('.filter-btn');
    allButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    btnElement.classList.add('active');
    btnElement.setAttribute('aria-pressed', 'true');

    if (category === 'All') {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => post.category === category);
    }

    // Re-apply existing search
    const searchInput = document.getElementById('search-input');
    if (searchInput.value) {
        const term = searchInput.value.toLowerCase();
        filteredPosts = filteredPosts.filter(post =>
            post.title.toLowerCase().includes(term) ||
            (post.excerpt && post.excerpt.toLowerCase().includes(term))
        );
    }

    currentPage = 1;
    document.getElementById('posts-grid').innerHTML = '';
    renderPosts();
}

function renderPosts() {
    log(`Rendering posts. Current page: ${currentPage}, Total filtered: ${filteredPosts.length}`);
    const grid = document.getElementById('posts-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');

    if (currentPage === 1) grid.innerHTML = '';

    const countToRender = currentPage * postsPerPage;
    const postsToShow = filteredPosts.slice((currentPage - 1) * postsPerPage, countToRender);

    log(`Showing ${postsToShow.length} items.`);

    if (countToRender >= filteredPosts.length) {
        loadMoreBtn.classList.add('hidden');
    } else {
        loadMoreBtn.classList.remove('hidden');
    }

    if (filteredPosts.length === 0) {
        grid.innerHTML = '<p class="no-results">No posts found.</p>';
        return;
    }

    postsToShow.forEach((post, index) => {
        const card = document.createElement('div');
        card.className = 'post-card glass';
        card.style.animationDelay = `${index * 0.1}s`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `Blog post: ${post.title}`);
        card.tabIndex = 0; // Make focusable for keyboard navigation

        // Handle different field names and provide defaults
        const authorDisplay = post.author || post.authorName || 'Anonymous';
        const imageUrl = post.image || 'https://via.placeholder.com/800x400?text=No+Image';

        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imageUrl}')" role="img" aria-label="Feature image for ${post.title}"></div>
            <div class="card-content">
                <div class="card-meta">
                    <span class="badge" aria-label="Category">${post.category}</span>
                    <span class="read-time" aria-label="Reading time">${post.readTime}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.excerpt || ''}</p>
                <div class="card-footer">
                    <span class="author">By ${authorDisplay}</span>
                    <span class="date">${post.date}</span>
                </div>
            </div>
        `;

        const clickHandler = () => {
            window.location.href = `post.html?id=${post.id}`;
        };

        card.addEventListener('click', clickHandler);
        // Allow keyboard navigation
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
            }
        });

        grid.appendChild(card);
    });
    log('Render complete.');
}

// --- POST DETAIL PAGE LOGIC ---
async function initPostPage() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id'); // ID is string in Firestore

    // Use loose equality to match number IDs from JSON with string ID from URL
    let post = allPosts.find(p => p.id == postId);

    // If not found in cache (direct link access), fetch specifically
    if (!post && postId) {
        log("Post not found in local cache. Fetching direct from Firestore...");
        try {
            const docRef = doc(db, "posts", postId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                post = { id: docSnap.id, ...docSnap.data() };
                // Also push to allPosts for related logic (optional but helpful)
                allPosts.push(post);
            } else {
                log("Document does not exist in Firestore.");
            }
        } catch (e) {
            console.error(e);
            log(`Error fetching single doc: ${e.message}`);
        }
    }

    if (!post) {
        document.getElementById('post-detail-container').innerHTML = '<h2>Post not found</h2><a href="index.html">Return Home</a>';
        return;
    }

    // Handle different field names and provide defaults
    const authorDisplay = post.author || post.authorName || 'Anonymous';
    const imageUrl = post.image || 'https://via.placeholder.com/800x400?text=No+Image';

    // Populate Content
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-meta').textContent = `${post.date} • ${post.readTime} • By ${authorDisplay}`;
    document.getElementById('post-category').textContent = post.category;
    document.getElementById('post-image').style.backgroundImage = `url('${imageUrl}')`;
    document.getElementById('post-content').innerHTML = post.content;

    // Render Related Posts
    renderRelatedPosts(post);

    // Init Comments
    initComments();
}

function renderRelatedPosts(currentPost) {
    const container = document.getElementById('related-posts-grid');

    const related = allPosts
        .filter(p => p.category === currentPost.category && p.id !== currentPost.id)
        .slice(0, 3);

    if (related.length === 0) {
        document.getElementById('related-posts-section').style.display = 'none';
        return;
    }

    related.forEach(post => {
        const relatedImageUrl = post.image || 'https://via.placeholder.com/400x150?text=No+Image';
        const card = document.createElement('div');
        card.className = 'post-card glass';
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${relatedImageUrl}'); height: 150px;"></div>
            <div class="card-content" style="padding: 1rem;">
                <h4 style="margin-bottom:0.5rem; color:var(--text-main);">${post.title}</h4>
                <div class="card-footer" style="padding-top:0.5rem;">
                   <span style="font-size:0.8rem">${post.date}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `post.html?id=${post.id}`;
        });
        container.appendChild(card);
    });
}

function initComments() {
    const list = document.getElementById('comments-list');

    // Todo: Can implement Firestore comments subcollection here
    const message = document.createElement('p');
    message.textContent = "Comments are currently disabled.";
    // list.appendChild(message);
}

// Global Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
