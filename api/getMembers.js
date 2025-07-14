// File path: /api/getMembers.js
const admin = require('firebase-admin');

// Helper function to initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export default async function handler(request, response) {
  try {
    initializeFirebaseAdmin();
    const db = admin.database();
    const membersRef = db.ref('members');
    
    const snapshot = await membersRef.once('value');
    const membersData = snapshot.val();

    const transactions = [];
    if (membersData) {
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
    }

    const sortedTransactions = transactions.sort((a, b) => new Date(a.Date) - new Date(b.Date) || a.id - b.id);

    // --- THIS IS THE FIX ---
    // We are now also sending the ACCESS_PIN from Vercel's environment variables.
    response.status(200).json({ 
        transactions: sortedTransactions,
        accessPin: process.env.ACCESS_PIN // <-- YEH NAYI LINE JODI GAYI HAI
    });

  } catch (error) {
    console.error('Backend Error in getMembers.js:', error);
    response.status(500).json({ error: 'Server error occurred.', details: error.message });
  }
}

