console.log('Admin.js started');

import { uploadToCloudinary } from './cloudinary-config.js';

let db, collection, addDoc, getDocs, deleteDoc, doc, orderBy, query;

async function initFirebase() {
    try {
        const module = await import('./firebase-config.js');
        db = module.db;
        collection = module.collection;
        addDoc = module.addDoc;
        getDocs = module.getDocs;
        deleteDoc = module.deleteDoc;
        doc = module.doc;
        orderBy = module.orderBy;
        query = module.query;
        console.log('Firebase module loaded successfully');
        loadPostsForAdmin(); // Load posts after modules are ready
    } catch (e) {
        console.error('Failed to load firebase config:', e);
        document.getElementById('admin-posts-list').innerHTML = '<p style="color:red">Error loading Firebase. Check console.</p>';
        showStatus('Error loading backend. Some features may not work.', false);
    }
}

initFirebase();

// DOM Elements
const postForm = document.getElementById('post-form');
const submitBtn = document.getElementById('submit-btn');
const statusMsg = document.getElementById('status-msg');
const imageInput = document.getElementById('image-file');
const imgPreview = document.getElementById('img-preview');
const addSection = document.getElementById('add-post-section');
const manageSection = document.getElementById('manage-posts-section');
const showAddBtn = document.getElementById('show-add-btn');
const showListBtn = document.getElementById('show-list-btn');
const postsList = document.getElementById('admin-posts-list');

// Toggle Tabs
showAddBtn.addEventListener('click', () => {
    addSection.style.display = 'block';
    manageSection.style.display = 'none';
    showAddBtn.classList.add('active');
    showListBtn.classList.remove('active');
});

showListBtn.addEventListener('click', () => {
    addSection.style.display = 'none';
    manageSection.style.display = 'block';
    showAddBtn.classList.remove('active');
    showListBtn.classList.add('active');
    if (db) loadPostsForAdmin();
    else console.warn('Database not initialized yet');
});

// Image Preview
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Handle Submit
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const category = document.getElementById('category').value;
    const readTime = document.getElementById('readTime').value;
    const excerpt = document.getElementById('excerpt').value;
    const content = document.getElementById('content').value;
    const imageFile = imageInput.files[0];

    if (!imageFile) {
        showStatus('Please select an image', false);
        return;
    }

    try {
        setLoading(true);
        showStatus('Uploading image to Cloudinary...', true);

        // 1. Upload Image to Cloudinary
        const imageUrl = await uploadToCloudinary(imageFile);

        // 2. Add Document to Firestore
        showStatus('Saving post...', true);

        await addDoc(collection(db, "posts"), {
            title,
            author,
            category,
            readTime,
            excerpt,
            content,
            image: imageUrl,
            status: 'published',
            authorName: author,
            authorId: 'admin',
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            timestamp: Date.now() // for sorting
        });

        showStatus('Post published successfully!', true);
        postForm.reset();
        imgPreview.style.display = 'none';

    } catch (error) {
        console.error("Error adding doc: ", error);
        showStatus('Error: ' + error.message, false);
    } finally {
        setLoading(false);
    }
});

async function loadPostsForAdmin() {
    postsList.innerHTML = '<p>Loading...</p>';

    try {
        if (!db) throw new Error('Firebase not initialized');
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        postsList.innerHTML = '';

        if (querySnapshot.empty) {
            postsList.innerHTML = '<p>No posts found.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const div = document.createElement('div');
            div.className = 'admin-post-item';
            div.innerHTML = `
                <div>
                    <strong>${post.title}</strong>
                    <br>
                    <small>${post.date} - ${post.author}</small>
                </div>
                <button class="delete-btn" onclick="deletePost('${doc.id}')">Delete</button>
            `;
            postsList.appendChild(div);
        });

    } catch (e) {
        postsList.innerHTML = `<p style="color:red">Error loading posts: ${e.message}</p>`;
    }
}

// Global scope for HTML onclick access
window.deletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        await deleteDoc(doc(db, "posts", id));
        loadPostsForAdmin(); // Refresh list
    } catch (e) {
        alert('Error deleting: ' + e.message);
    }
};

function showStatus(msg, isSuccess) {
    statusMsg.textContent = msg;
    statusMsg.style.display = 'block';
    statusMsg.className = `status-msg ${isSuccess ? 'status-success' : 'status-error'}`;
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Processing...' : 'Publish Post';
}

// AI FILL BUTTON
// AI FILL BUTTON - Cycles through 3 scenarios
const demoPosts = [
    {
        title: "The Future of Learning: AI Companions",
        author: "Campus Tech Bot",
        category: "Technology",
        readTime: "4 min read",
        excerpt: "Discover how AI robots are transforming study sessions at University of Sindh.",
        content: `<h3>A New Era of Studying</h3>
<p>Imagine a library where you never have to search for a book alone. Our new AI study companions are here to help students find resources, answer complex questions, and even provide study tips.</p>
<p>With a sleek glassmorphism design and friendly interface, these robots are the future of campus life. They integrate seamlessly with the university's digital archive, providing instant access to millions of research papers.</p>
<blockquote>"It's like having a personal tutor available 24/7," says one computer science student.</blockquote>`
    },
    {
        title: "Top 5 Hidden Spots on Campus",
        author: "Sarah J.",
        category: "student Guide",
        readTime: "3 min read",
        excerpt: "Looking for a quiet place to study? Check out these secret locations.",
        content: `<h3>1. The Rooftop Garden</h3>
<p>Located on top of the Science Block, this garden offers a breathtaking view of Naushahro Feroze. It's perfect for evening reading sessions.</p>
<h3>2. The Old Archives Section</h3>
<p>Tucked away in the basement of the main library, this cozy corner smells like old books and silence. Wi-Fi signal is surprisingly strong here!</p>
<h3>3. The Coffee Kiosk Behind IT Center</h3>
<p>Not exactly hidden, but definitely underrated. Their espresso is the fuel that runs our coding marathons.</p>`
    },
    {
        title: "University Wins National Cricket Championship",
        author: "Sports Desk",
        category: "Events",
        readTime: "2 min read",
        excerpt: "Our team brings home the trophy after a thrilling final match.",
        content: `<h3>Victory for Sindh University!</h3>
<p>In a nail-biting finish yesterday, our university cricket team secured the National Inter-Varsity Championship trophy. The final match was attended by over 5,000 students who cheered for every run.</p>
<p>Captain Ahmed Ali led the team to victory with a stunning century. "This win belongs to every student who supported us," he said during the ceremony.</p>
<p>Celebrations are expected to continue throughout the week!</p>`
    }
];

let demoIndex = 0;

document.getElementById('ai-fill-btn').addEventListener('click', () => {
    const post = demoPosts[demoIndex];

    document.getElementById('title').value = post.title;
    document.getElementById('author').value = post.author;
    document.getElementById('category').value = post.category;
    document.getElementById('readTime').value = post.readTime;
    document.getElementById('excerpt').value = post.excerpt;
    document.getElementById('content').value = post.content;

    // Update index for next click
    demoIndex = (demoIndex + 1) % demoPosts.length;

    showStatus(`Loaded Demo #${demoIndex === 0 ? 3 : demoIndex}. Click again for next story!`, true);
});
