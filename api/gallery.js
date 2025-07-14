// File path: /api/gallery.js
const admin = require('firebase-admin');

// Helper function to initialize Firebase Admin
// This will use the single FIREBASE_DATABASE_URL you have set
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL // Using the main database URL
  });
}

export default async function handler(request, response) {
  try {
    const app = initializeFirebaseAdmin();
    // IMPORTANT: We are now using a specific path 'galleryImages' inside your main database
    const db = admin.database(app);
    const imagesRef = db.ref('galleryImages');

    // GET: Fetch all images
    if (request.method === 'GET') {
      const snapshot = await imagesRef.orderByChild('timestamp').once('value');
      const imageData = snapshot.val() || {};
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
        likes: { count: 0, likedBy: {} }
      });
      return response.status(201).json({ message: 'Image uploaded successfully!', id: newImageRef.key });
    }
    
    // PUT: Like or Unlike an image
    if (request.method === 'PUT') {
        const { imageId, likerName, unlike } = request.body;
        if (!imageId || !likerName) {
            return response.status(400).json({ error: 'Image ID and liker name are required.' });
        }
        const likeRef = db.ref(`galleryImages/${imageId}/likes`);
        await likeRef.transaction(currentLikes => {
            currentLikes = currentLikes || { count: 0, likedBy: {} };
            const userLikeKey = Object.entries(currentLikes.likedBy || {}).find(([, name]) => name === likerName)?.[0];
            if (unlike) {
                if (userLikeKey) {
                    currentLikes.count = Math.max(0, (currentLikes.count || 1) - 1);
                    delete currentLikes.likedBy[userLikeKey];
                }
            } else {
                if (!userLikeKey) {
                    currentLikes.count = (currentLikes.count || 0) + 1;
                    if (!currentLikes.likedBy) currentLikes.likedBy = {};
                    const newLikeKey = db.ref().push().key;
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
        await db.ref(`galleryImages/${imageId}`).remove();
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

