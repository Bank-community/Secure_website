// This file should be created at: /api/getMembers.js

// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Your Firebase service account key JSON.
// IMPORTANT: You need to get this from your Firebase project settings.
// Go to Project Settings -> Service accounts -> Generate new private key
// Then, copy the JSON content and paste it here.
// For better security, store this JSON content in a Vercel Environment Variable.
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL // Add your database URL as an env variable
  });
}

// Get a reference to the database service
const db = admin.database();

// The main Vercel serverless function
export default async function handler(request, response) {
  try {
    // Set CORS headers to allow requests from any origin
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests for CORS
    if (request.method === 'OPTIONS') {
      return response.status(200).end();
    }

    // Reference to the 'members' node in your database
    const membersRef = db.ref('members');
    
    // Fetch the data from Firebase
    const snapshot = await membersRef.once('value');
    const membersData = snapshot.val();

    // Process the data to create a flat list of transactions
    const transactions = [];
    if (membersData) {
        for (const memberKey in membersData) {
            const member = membersData[memberKey];
            if (member.transactions) {
                for (const transactionId in member.transactions) {
                    const tx = member.transactions[transactionId];
                    const formattedTransaction = {
                        id: transactions.length,
                        Date: tx.Date, // Keep date as string
                        Name: member.name || memberKey,
                        Loan: parseFloat(tx.Loan) || 0,
                        Payment: parseFloat(tx["Loan Payment"]) || 0,
                        SipPayment: parseFloat(tx["SIP Payment"]) || 0,
                        ReturnAmount: parseFloat(tx["Return amount"] || tx["Return amount "]) || 0,
                        ImageUrl: tx.imageUrl || null
                    };
                    if (formattedTransaction.Name && formattedTransaction.Date) {
                        transactions.push(formattedTransaction);
                    }
                }
            }
        }
    }

    // Sort transactions by date
    const sortedTransactions = transactions.sort((a, b) => new Date(a.Date) - new Date(b.Date) || a.id - b.id);

    // Send the processed data back to the frontend
    response.status(200).json({ transactions: sortedTransactions });

  } catch (error) {
    console.error('Firebase Read Failed in Backend:', error);
    // Send a detailed error message back to the frontend
    response.status(500).json({ error: 'Failed to load member data from the server.', details: error.message });
  }
}

