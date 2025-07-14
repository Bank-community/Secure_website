// File path: /api/gallery.js

const admin = require('firebase-admin');

// Helper function to initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }
  // This function uses the Environment Variables you set in Vercel
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL_GALLERY // Using a specific URL for the gallery database
  });
}

// The main Vercel serverless function
export default async function handler(request, response) {
  try {
    initializeFirebaseAdmin();
    const db = admin.database();
    const imagesRef = db.ref('images');

    // --- Handle different request methods ---

    // GET: Fetch all images
    if (request.method === 'GET') {
      const snapshot = await imagesRef.orderByChild('timestamp').once('value');
      const imageData = snapshot.val() || {};
      // Convert to array and reverse to show newest first
      const allImages = Object.entries(imageData).map(([id, data]) => ({ id, ...data })).reverse();
      return response.status(200).json(allImages);
    }

    // POST: Add a new image
    if (request.method === 'POST') {
      const { personName, url } = request.body;
      if (!personName || !url) {
        return response.status(400).json({ error: 'Name and image URL are required.' });
      }
      const newImageRef = imagesRef.push();
      await newImageRef.set({
        personName: personName.trim(),
        url: url,
        timestamp: Date.now(),
        likes: { count: 0 }
      });
      return response.status(201).json({ message: 'Image uploaded successfully!', id: newImageRef.key });
    }

    // PUT: Like or Unlike an image
    if (request.method === 'PUT') {
        const { imageId, likerName, unlike } = request.body;
        if (!imageId || !likerName) {
            return response.status(400).json({ error: 'Image ID and liker name are required.' });
        }
        
        const likeRef = db.ref(`images/${imageId}/likes`);
        
        await likeRef.transaction(currentLikes => {
            currentLikes = currentLikes || { count: 0, likedBy: {} };
            const userLikeKey = Object.entries(currentLikes.likedBy || {}).find(([, name]) => name === likerName)?.[0];

            if (unlike) { // Unlike action
                if (userLikeKey) {
                    currentLikes.count = Math.max(0, (currentLikes.count || 1) - 1);
                    delete currentLikes.likedBy[userLikeKey];
                }
            } else { // Like action
                if (!userLikeKey) {
                    currentLikes.count = (currentLikes.count || 0) + 1;
                    if (!currentLikes.likedBy) currentLikes.likedBy = {};
                    const newLikeKey = db.ref().push().key; // Generate a unique key for the like
                    currentLikes.likedBy[newLikeKey] = likerName;
                }
            }
            return currentLikes;
        });
        return response.status(200).json({ message: 'Like status updated.' });
    }

    // DELETE: Delete an image
    if (request.method === 'DELETE') {
        const { imageId } = request.body;
        if (!imageId) {
            return response.status(400).json({ error: 'Image ID is required.' });
        }
        await db.ref(`images/${imageId}`).remove();
        return response.status(200).json({ message: 'Image deleted successfully.' });
    }

    // If method is not supported
    response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);

  } catch (error) {
    console.error('Gallery API Error:', error);
    response.status(500).json({ error: 'Server error occurred.', details: error.message });
  }
}

