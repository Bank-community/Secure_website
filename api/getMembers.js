const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) { return; }
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
    if (!membersData) {
      return response.status(200).json({ transactions: [] });
    }
    const transactions = [];
    for (const memberKey in membersData) {
      const member = membersData[memberKey];
      if (member.transactions) {
        for (const txId in member.transactions) {
          const tx = member.transactions[txId];
          transactions.push({
            id: transactions.length, Date: tx.Date, Name: member.name || memberKey,
            Loan: parseFloat(tx.Loan) || 0, Payment: parseFloat(tx["Loan Payment"]) || 0,
            SipPayment: parseFloat(tx["SIP Payment"]) || 0,
            ReturnAmount: parseFloat(tx["Return amount"] || tx["Return amount "]) || 0,
            ImageUrl: tx.imageUrl || null
          });
        }
      }
    }
    const sortedTransactions = transactions.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    response.status(200).json({ transactions: sortedTransactions });
  } catch (error) {
    console.error('Backend Error:', error);
    response.status(500).json({ error: 'Server error', details: error.message });
  }
}

