// Cloudinary Configuration
// Free image hosting - no Firebase Storage billing needed!

export const CLOUDINARY_CONFIG = {
    cloudName: 'dwgyyrqej',
    uploadPreset: 'blog_images'
};

// Upload image to Cloudinary
export async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
            method: 'POST',
            body: formData
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Returns the image URL
}
