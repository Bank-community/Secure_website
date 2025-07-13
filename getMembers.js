// File path should be: /api/getMembers.js

// We use 'require' because firebase-admin is a CommonJS module.
const admin = require('firebase-admin');

// --- Helper function to initialize Firebase Admin ---
// This ensures we don't try to initialize the app more than once.
function initializeFirebaseAdmin() {
  // Check if the app is already initialized
  if (admin.apps.length > 0) {
    return;
  }

  // Check if the required environment variables are present
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY || !process.env.FIREBASE_DATABASE_URL) {
    throw new Error('Firebase environment variables are not set in Vercel.');
  }

  // Parse the service account key from the environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  // Initialize the app with credentials and database URL
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}


// --- The main Vercel Serverless Function ---
export default async function handler(request, response) {
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    // Get a reference to the database service
    const db = admin.database();
    const membersRef = db.ref('members');

    // Fetch the data from Firebase
    const snapshot = await membersRef.once('value');
    const membersData = snapshot.val();

    // If no data is found, return an empty array
    if (!membersData) {
      return response.status(200).json({ transactions: [] });
    }

    // Process the data to create a flat list of transactions
    const transactions = [];
    for (const memberKey in membersData) {
      const member = membersData[memberKey];
      if (member.transactions) {
        for (const transactionId in member.transactions) {
          const tx = member.transactions[transactionId];
          transactions.push({
            id: transactions.length,
            Date: tx.Date,
            Name: member.name || memberKey,
            Loan: parseFloat(tx.Loan) || 0,
            Payment: parseFloat(tx["Loan Payment"]) || 0,
            SipPayment: parseFloat(tx["SIP Payment"]) || 0,
            ReturnAmount: parseFloat(tx["Return amount"] || tx["Return amount "]) || 0,
            ImageUrl: tx.imageUrl || null
          });
        }
      }
    }

    // Sort transactions by date
    const sortedTransactions = transactions.sort((a, b) => new Date(a.Date) - new Date(b.Date) || a.id - b.id);

    // --- Success Response ---
    // Send the processed data back to the frontend
    response.status(200).json({ transactions: sortedTransactions });

  } catch (error) {
    // --- Error Response ---
    console.error('Backend Error:', error);
    // Send a detailed error message back to the frontend for debugging
    response.status(500).json({ 
        error: 'Server error: Failed to load member data.', 
        details: error.message 
    });
  }
}

