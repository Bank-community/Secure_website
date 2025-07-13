// File path: /api/getMembers.js
// This is a temporary debugging code.

export default async function handler(request, response) {
  try {
    // Let's check if the environment variables exist.
    const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const dbUrl = process.env.FIREBASE_DATABASE_URL;

    if (!serviceKey) {
      // If the service key is missing, send a specific error.
      return response.status(500).json({ 
        error: "❌ FIREBASE_SERVICE_ACCOUNT_KEY नहीं मिला!",
        details: "कृपया Vercel सेटिंग्स में इसे दोबारा जाँचें।"
      });
    }

    if (!dbUrl) {
      // If the database URL is missing, send a specific error.
      return response.status(500).json({ 
        error: "❌ FIREBASE_DATABASE_URL नहीं मिला!",
        details: "कृपया Vercel सेटिंग्स में इसे दोबारा जाँचें।"
      });
    }

    // If both keys are found, send a success message.
    response.status(200).json({ 
      message: "✅ बहुत बढ़िया! दोनों Environment Variables सफलतापूर्वक मिल गए हैं।",
      details: "अब आप असली कोड वापस डालकर Redeploy कर सकते हैं।"
    });

  } catch (error) {
    // Catch any other unexpected errors.
    response.status(500).json({ 
      error: "एक अनपेक्षित एरर आई।", 
      details: error.message 
    });
  }
}

