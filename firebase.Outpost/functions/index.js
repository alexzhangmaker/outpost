const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

//2025-07-15 07:33 commented to figure out why functions failed to start
/*
// Initialize Storage
const storage = new Storage();

// Get the default bucket; use environment variable or fallback
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || functions.config().firebase?.storageBucket || 'outpost-8d74e.appspot.com';
const bucket = storage.bucket(bucketName);
*/

// Initialize Express app for existing API
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Debug root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Function is running' });
});

// GET endpoint: /api
app.get('/API', (req, res) => {
  try {
    const queryParams = req.query;
    res.status(200).json({
      message: 'GET request successful',
      params: queryParams,
      data: []
    });
  } catch (error) {
    console.error('Error in GET /api:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST endpoint: /api
app.post('/API', (req, res) => {
  try {
    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }
    res.status(201).json({
      message: 'POST request successful',
      data: body
    });
  } catch (error) {
    console.error('Error in POST /api:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET endpoint: /api
//http://127.0.0.1:5001/outpost-8d74e/us-central1/outpost/Speak?th=อุบัติเหตุ
app.get('/Speak', async (req, res) => {
  try {
    const queryParams = req.query;
    // Get Thai word from query parameter or body
    const text = req.query.text || req.body.text;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    // Initialize Text-to-Speech client
    const client = new textToSpeech.TextToSpeechClient();

    // Configure TTS request
    const request = {
      input: { text: text },
      voice: { languageCode: 'th-TH', ssmlGender: 'FEMALE', name: 'th-TH-Neural2-C' },
      audioConfig: { audioEncoding: 'MP3' }
    };

    // Perform Text-to-Speech request
    const [response] = await client.synthesizeSpeech(request);

    // Set response headers for MP3 audio
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.audioContent.length,
      'Content-Disposition': `attachment; filename="tts_${Date.now()}.mp3"`
    });

    // Send MP3 audio as binary data
    res.status(200).send(response.audioContent);
  }catch (error) {
    console.error('Error in /Speak:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/*
// THIS BLOCK IS REQUIRED FOR CLOUD FUNCTIONS (2ND GEN) HTTP FUNCTIONS
// Cloud Run (which 2nd Gen functions use) expects your app to listen on the PORT environment variable.
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
*/

// Export the existing Express app as a Cloud Function
exports.outpost = functions.https.onRequest(app);
