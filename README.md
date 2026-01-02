# University of Sindh Blog - Campus Naushahro Feroze

A modern, glass-morphism style blog website for the University of Sindh, Campus Naushahro Feroze.

## Features
- **Premium Design**: Glass-morphism UI with responsive layout and dark/light mode.
- **Interactive Background**: Custom 3D flying birds animation using Three.js and Boids algorithm.
- **Rich Content**: Support for images, authors, categories, and HTML content.
- **Features**: Search, Category Filtering, Pagination, and Comments UI.
- **Firebase CMS**: Frontend-only content management system using Firestore and Storage.

## Firebase Setup (REQUIRED)
To make the blog functional (add/edit posts), you must set up a free Firebase project:

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project** and name it (e.g., `usn-blog`).
3.  Disable Google Analytics (not needed for now) and create the project.
4.  **Add Web App**:
    *   Click the **Web** icon (`</>`).
    *   Register app nickname (e.g., `My Blog`).
    *   Copy the `firebaseConfig` object (apiKey, authDomain, etc.).
5.  **Edit Config**:
    *   Open `js/firebase-config.js`.
    *   Replace the placeholder `firebaseConfig` values with your copied keys.
6.  **Setup Firestore**:
    *   Go to **Firestore Database** in the side menu.
    *   Click **Create database**.
    *   Select **Start in test mode** (allows read/write for 30 days).
    *   Choose a location (default is fine).
7.  **Setup Storage**:
    *   Go to **Storage** in the side menu.
    *   Click **Get started**.
    *   Select **Start in test mode**.
    *   Click **Done**.

## Admin Panel
- Access `admin.html` to manage your blog posts.
- You can Add, Delete, and Upload images for blog posts directly from this page.
- **Note**: Currently, the admin page is open. For production, you should add Firebase Authentication.

## Local Development
1.  Clone/Download the repository.
2.  Install dependencies (optional, mostly for dev tools):
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://127.0.0.1:8080` in your browser.

## Technologies
- **HTML5/CSS3**: Vanilla CSS for styling.
- **JavaScript (ES6+)**: Logic and Three.js integration.
- **Three.js**: Custom background animation.
- **Firebase**: Backend-as-a-Service (Firestore, Storage).

## Credits
Student-run initiative for University of Sindh (Naushahro Feroze).
