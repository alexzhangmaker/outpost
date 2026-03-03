import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generate } from 'short-uuid';

import { geminiAgent, mastra, imageExtractionSchema, MARKDOWN_EXTRACTION_PROMPT, commonSentencesSchema, COMMON_SENTENCES_PROMPT, thaiArticleSchema, THAI_ARTICLE_PROMPT, thaiWordLearningSchema, THAI_WORD_LEARNING_PROMPT, thaiConsonantSchema, THAI_CONSONANT_PROMPT } from './agent.js';
import { saveMessage, getMessages, createSession, saveResult, getResults, updateResult, getResultById, saveArticle, getArticles, getArticleById, updateArticle } from './database.js';
import { generateThaiAudio } from './tts.js';
import { saveToRealtimeDb, updateRealtimeDb, uploadAudioToStorage, getFromRealtimeDb, saveArticleToFirebase } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (one level up from src or dist)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());
// Serve static files from the root outpost directory
const rootDir = path.resolve(__dirname, '../../');
app.use(express.static(rootDir));
console.log(`Serving static files from: ${rootDir}`);

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const port = process.env.PORT || 3000;

app.get('/api/tts-proxy', async (req: any, res: any) => {
  const text = req.query.text as string;
  const sync = req.query.sync === 'true';
  const pKey = req.query.pKey as string;
  const toneKey = req.query.toneKey as string;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const targetUrl = `https://googleapi-w56agazoha-uc.a.run.app/?text=${encodeURIComponent(text)}`;
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`Upstream TTS Proxy returned ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If sync is requested, perform background tasks
    if (sync && pKey && toneKey) {
      (async () => {
        try {
          const modulePath = (req.query.modulePath as string) || 'thaiIPA';
          console.log(`[Background Sync] Starting for ${text} (${modulePath}/practices/${pKey}/${toneKey})`);
          const fileName = `${text.replace(/\//g, '_')}_${toneKey}_${Date.now()}.mp3`;
          const downloadURL = await uploadAudioToStorage(buffer, fileName, modulePath);

          const dbPath = `${modulePath}/practices/${pKey}/${toneKey}`;
          await updateRealtimeDb(dbPath, { audioURL: downloadURL });
          console.log(`[Background Sync] Success: ${downloadURL}`);
        } catch (err) {
          console.error(`[Background Sync] Failed:`, err);
        }
      })();
    }

    res.set('Content-Type', 'audio/mpeg');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (error: any) {
    console.error('TTS Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/thai-consonant/generate', async (req: any, res: any) => {
  const { word } = req.body;

  if (!word) return res.status(400).json({ error: 'Word is required' });

  try {
    console.log(`[Consonant Gen] Generating data for word: "${word}"`);

    // 1. Generate IPA and Meaning via Gemini
    const result = await (geminiAgent as any).generate(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: THAI_CONSONANT_PROMPT },
            { type: 'text', text: word }
          ],
        },
      ],
      {
        structuredOutput: {
          schema: thaiConsonantSchema,
        },
      },
    );

    const data = result.object;

    // 2. Generate Audio
    console.log(`[Consonant Gen] Generating audio for word: "${word}"`);
    const audioBuffer = await generateThaiAudio(word);
    const audioId = generate();
    const fileName = `consonant_${audioId}.mp3`;
    const audioUrl = await uploadAudioToStorage(audioBuffer, fileName, 'audioConsonants');

    data.audioURL = audioUrl;

    res.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error('[Consonant Gen] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/thai-word-learning/generate', async (req: any, res: any) => {
  const { word, sessionId = 'thai-word-learning' } = req.body;

  if (!word) return res.status(400).json({ error: 'Word is required' });

  console.log(`[Generate] Starting generation for word: "${word}" in session: ${sessionId}`);

  try {
    createSession(sessionId);

    // 1. Generate with Gemini
    console.log('[Generate] Step 1: Calling Gemini API...');
    const result = await (geminiAgent as any).generate(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: THAI_WORD_LEARNING_PROMPT },
            { type: 'text', text: word }
          ],
        },
      ],
      {
        structuredOutput: {
          schema: thaiWordLearningSchema,
        },
      },
    );

    let data = result.object;
    console.log('[Generate] Gemini returned data successfully');

    // 2. Save to local SQLite (Intermediate state)
    const localId = saveResult(sessionId, ['gemini-generated'], data, 'thai_word_learning');
    console.log(`[Generate] Step 2: Saved to local SQLite, id: ${localId}`);

    // 3. Process Audio
    const processAudio = async (text: string) => {
      if (!text) return null;
      // Clean text for TTS (remove underscores for completion exercises)
      const cleanText = text.replace(/_+/g, ' ').trim();

      // Safety check: TTS has a limit, and we want to avoid processing garbage/loops
      if (cleanText.length > 500) {
        console.warn(`[Generate] Skipping TTS for excessively long text (${cleanText.length} chars): "${cleanText.substring(0, 100)}..."`);
        return null;
      }

      // Basic repetition check (e.g. if a phrase is repeated more than 3 times)
      const sentences = cleanText.split(/[。.]/);
      if (sentences.length > 10) {
        console.warn(`[Generate] Skipping TTS for potentially looping text (too many sentences): "${cleanText.substring(0, 100)}..."`);
        return null;
      }

      try {
        const audioBuffer = await generateThaiAudio(cleanText);
        const fileName = `${generate()}.mp3`;
        return await uploadAudioToStorage(audioBuffer, fileName, 'ThaiWordsListen');
      } catch (err) {
        console.error(`[Generate] TTS Error for "${cleanText.substring(0, 50)}...":`, err);
        return null;
      }
    };

    console.log(`[Generate] Step 3: Generating audio for word and examples...`);
    data.audioURL = await processAudio(data.word);
    console.log(`[Generate] Word audio: ${data.audioURL}`);

    // Process Examples
    for (const ex of data.example_sentences) {
      ex.audioURL = await processAudio(ex.sentence);
      console.log(`[Generate] Example audio (${ex.id}): ${ex.audioURL}`);
    }

    // Process Synonyms
    for (const [idx, syn] of data.synonyms.entries()) {
      syn.audioURL = await processAudio(syn.word);
      console.log(`[Generate] Synonym audio (${idx}): ${syn.audioURL}`);
    }

    // Process Antonyms
    for (const [idx, ant] of data.antonyms.entries()) {
      ant.audioURL = await processAudio(ant.word);
      console.log(`[Generate] Antonym audio (${idx}): ${ant.audioURL}`);
    }

    // Process Word Family
    for (const [idx, family] of data.word_family.entries()) {
      family.audioURL = await processAudio(family.form);
      console.log(`[Generate] Word family audio (${idx}): ${family.audioURL}`);
      if (family.example) {
        family.example.audioURL = await processAudio(family.example.sentence);
        console.log(`[Generate] Word family example audio (${idx}): ${family.example.audioURL}`);
      }
    }

    // Process Exercises
    for (const [eIdx, ex] of data.exercises.entries()) {
      if (ex.questions) {
        for (const [qIdx, q] of ex.questions.entries()) {
          if (q.sentence) {
            q.audioURL = await processAudio(q.sentence);
            console.log(`[Generate] Exercise ${eIdx} Question ${qIdx} audio: ${q.audioURL}`);
          }
        }
      }
    }

    console.log('[Generate] Audio processing complete');

    // 4. Update local SQLite with final data (including audioURLs)
    updateResult(Number(localId), data);
    console.log('[Generate] Step 4: Final local update complete');

    // 5. Save to Firebase ThaiWordsListen
    console.log('[Generate] Step 5: Updating Firebase Realtime DB...');
    await updateRealtimeDb(`ThaiWordsListen/${data.word}`, data);
    console.log('[Generate] Firebase update complete');

    res.json({ success: true, localId, data });

  } catch (error: any) {
    console.error('[Generate] FATAL ERROR:', error);
    const errorLog = `\n[${new Date().toISOString()}] Word: ${word}\nError: ${error.message}\nStack: ${error.stack}\n`;
    fs.appendFileSync(path.resolve(__dirname, '../server-errors.log'), errorLog);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/thai-word-learning/check/:word', async (req: any, res: any) => {
  const { word } = req.params;
  try {
    const data = await getFromRealtimeDb(`ThaiWordsListen/${word}`);
    res.json({ exists: !!data, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/thai-word-learning/fix-audio', async (req: any, res: any) => {
  const { word } = req.body;

  if (!word) return res.status(400).json({ error: 'Word is required' });

  console.log(`[FixAudio] Starting audio repair for word: "${word}"`);

  try {
    const data = await getFromRealtimeDb(`ThaiWordsListen/${word}`);
    if (!data) return res.status(404).json({ error: 'Word not found in Firebase' });

    const processAudio = async (text: string) => {
      if (!text) return null;
      const cleanText = text.replace(/_+/g, ' ').trim();
      try {
        const audioBuffer = await generateThaiAudio(cleanText);
        const fileName = `${generate()}.mp3`;
        return await uploadAudioToStorage(audioBuffer, fileName, 'ThaiWordsListen');
      } catch (err) {
        console.error(`[FixAudio] TTS Error for "${text}":`, err);
        return null;
      }
    };

    if (!data.audioURL) {
      data.audioURL = await processAudio(data.word);
    }

    for (const ex of data.example_sentences) {
      if (!ex.audioURL) ex.audioURL = await processAudio(ex.sentence);
    }

    for (const syn of data.synonyms) {
      if (!syn.audioURL) syn.audioURL = await processAudio(syn.word);
    }

    for (const ant of data.antonyms) {
      if (!ant.audioURL) ant.audioURL = await processAudio(ant.word);
    }

    for (const family of data.word_family) {
      if (!family.audioURL) family.audioURL = await processAudio(family.form);
      if (family.example && !family.example.audioURL) {
        family.example.audioURL = await processAudio(family.example.sentence);
      }
    }

    for (const ex of data.exercises) {
      if (ex.questions) {
        for (const q of ex.questions) {
          if (q.sentence && !q.audioURL) q.audioURL = await processAudio(q.sentence);
        }
      }
    }

    await updateRealtimeDb(`ThaiWordsListen/${data.word}`, data);
    res.json({ success: true, data });

  } catch (error: any) {
    console.error('[FixAudio] FATAL ERROR:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/thai-ipa/practices', async (req: any, res: any) => {
  const { path, data } = req.body;

  // Backward compatibility or if only data is sent
  const targetPath = path || 'thaiIPA';
  const practicesData = data || req.body;

  if (!practicesData) return res.status(400).json({ error: 'Data is required' });

  try {
    const dbPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;

    // If it's a full module (has title and practices), we might want to save the whole thing
    if (practicesData.title && practicesData.practices) {
      await updateRealtimeDb(dbPath, practicesData);
    } else {
      // Otherwise append to practices
      await saveToRealtimeDb(`${dbPath}/practices`, practicesData);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Firebase Save Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/firebase/set', async (req: any, res: any) => {
  const { path, data } = req.body;
  if (!path || data === undefined) return res.status(400).json({ error: 'Path and data are required' });

  try {
    const dbPath = path.startsWith('/') ? path.substring(1) : path;
    const { getDatabase } = await import('./firebase.js');
    const adminDb = getDatabase();
    await adminDb.ref(dbPath).set(data);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Firebase Proxy Set Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/firebase/results', async (req: any, res: any) => {
  const path = req.query.path as string || 'sentencePatterns';
  try {
    const data = await getFromRealtimeDb(path);
    res.json({ results: data || {} });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Gemini Agent Service is running.',
    endpoints: [
      '/api/thai-word-learning/generate',
      '/api/thai-consonant/generate',
      '/api/firebase/set',
      '/api/articles/process',
      '/api/history/:sessionId'
    ]
  });
});

app.post('/api/process-images', upload.array('images'), async (req: any, res: any) => {
  const files = req.files as Express.Multer.File[];
  const sessionId = req.body.sessionId || 'default';

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded' });
  }

  try {
    createSession(sessionId);

    const messageParts = [
      { type: 'text', text: 'Analyze these images and extract the content into the required JSON format.' },
      ...files.map(file => ({
        type: 'image',
        image: fs.readFileSync(file.path).toString('base64'),
        mimeType: file.mimetype,
      }))
    ];

    const result = await (geminiAgent as any).generate(
      [
        {
          role: 'user',
          content: messageParts,
        },
      ],
      {
        structuredOutput: {
          schema: imageExtractionSchema,
        },
      },
    );

    const extractedData = result.object;
    const imagePaths = files.map(f => f.path);

    // Phase 1: Save to local SQLite only
    saveResult(sessionId, imagePaths, extractedData);

    res.json({
      success: true,
      sessionId,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/extract/markdown', async (req: any, res: any) => {
  const { content, sessionId = 'default' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    createSession(sessionId);

    const result = await (geminiAgent as any).generate(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: MARKDOWN_EXTRACTION_PROMPT },
            { type: 'text', text: content }
          ],
        },
      ],
      {
        structuredOutput: {
          schema: imageExtractionSchema,
        },
      },
    );

    const extractedData = result.object;

    // Phase 1: Save to local SQLite only (same as images)
    saveResult(sessionId, ['text-source'], extractedData);

    res.json({
      success: true,
      sessionId,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Error extracting markdown:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.put('/api/results/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const { extractedData } = req.body;

  if (!extractedData) {
    return res.status(400).json({ error: 'extractedData is required' });
  }

  try {
    updateResult(id, extractedData);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/finalize-audio/:id', async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const record: any = getResultById(id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    let extractedData = JSON.parse(record.extractedData);

    // 2. Generate audio for each example
    if (extractedData.patterns) {
      for (const pattern of extractedData.patterns) {
        if (pattern.examples) {
          for (const example of pattern.examples) {
            if (example.thai && !example.audioThai) {
              console.log(`Generating audio for: ${example.thai}`);
              try {
                const audioBuffer = await generateThaiAudio(example.thai);
                const audioId = generate();
                const fileName = `${audioId}.mp3`;
                const audioUrl = await uploadAudioToStorage(audioBuffer, fileName);
                example.audioThai = audioUrl;
              } catch (ttsError) {
                console.error(`TTS Error for "${example.thai}":`, ttsError);
              }
            }
          }
        }
      }
    }

    // 3. Update local SQLite with enhanced data
    updateResult(id, extractedData);

    // 4. Save to Firebase Realtime Database
    await saveToRealtimeDb('sentencePatterns', {
      sessionId: record.sessionId,
      ...extractedData,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Error finalizing audio:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/import/json', async (req: any, res: any) => {
  const { content, sessionId = 'manual-import' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const data = JSON.parse(content);
    let type = 'pattern';
    if (data.sections) type = 'common';
    else if (data.paragraphs) type = 'article';

    if (type === 'article') {
      saveArticle(data);
      return res.json({ success: true, id: data.id, type });
    }

    const id = saveResult(sessionId, ['manual-import'], data, type);
    res.json({
      success: true,
      id,
      type,
      data
    });
  } catch (error: any) {
    console.error('Error importing JSON:', error);
    res.status(400).json({ error: 'Invalid JSON: ' + error.message });
  }
});

app.post('/api/extract/common-sentences', async (req: any, res: any) => {
  const { content, sessionId = 'default' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    createSession(sessionId);

    const result = await (geminiAgent as any).generate(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: COMMON_SENTENCES_PROMPT },
            { type: 'text', text: content }
          ],
        },
      ],
      {
        structuredOutput: {
          schema: commonSentencesSchema,
        },
      },
    );

    const extractedData = result.object;
    saveResult(sessionId, ['common-text'], extractedData, 'common');

    res.json({
      success: true,
      sessionId,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Error extracting common sentences:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/finalize-common-sentences/:id', async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const record: any = getResultById(id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    let extractedData = JSON.parse(record.extractedData);

    // Generate audio for common sentences
    if (extractedData.sections) {
      for (const section of extractedData.sections) {
        if (section.categories) {
          for (const category of section.categories) {
            if (category.sentences) {
              for (const sentence of category.sentences) {
                if (sentence.thai && !sentence.audioPath) {
                  console.log(`Generating audio for common sentence: ${sentence.thai}`);
                  try {
                    const audioBuffer = await generateThaiAudio(sentence.thai);
                    const audioId = generate();
                    const fileName = `${audioId}.mp3`;
                    const audioUrl = await uploadAudioToStorage(audioBuffer, fileName);
                    sentence.audioPath = audioUrl; // Use audioPath for common sentences
                  } catch (ttsError) {
                    console.error(`TTS Error for "${sentence.thai}":`, ttsError);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Update local SQLite
    updateResult(id, extractedData);

    // Save to Firebase Realtime Database
    await saveToRealtimeDb('commonSentences', {
      sessionId: record.sessionId,
      ...extractedData,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Error finalizing common sentences:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// --- Thai Close Reading Article Endpoints ---

// Step 1: Process text/markdown via Gemini and save to local SQLite
app.post('/api/articles/process', async (req: any, res: any) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    console.log('Processing Thai article with Gemini...');

    const result = await (geminiAgent as any).generate(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: THAI_ARTICLE_PROMPT },
            { type: 'text', text: content }
          ],
        },
      ],
      {
        structuredOutput: {
          schema: thaiArticleSchema,
        },
      },
    );

    const article = result.object;
    article.status = 'pending_verification';

    saveArticle(article);

    res.json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    console.error('Error processing article:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// List articles for verification
app.get('/api/articles', async (req: any, res: any) => {
  try {
    const status = req.query.status as string;
    const articles = getArticles(status);
    res.json({ success: true, articles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Finalize article - Generate TTS, Upload to Firebase Storage, Save to Firebase DB
app.post('/api/articles/:id/finalize', async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const record = getArticleById(id) as any;
    if (!record) {
      return res.status(404).json({ error: 'Article not found' });
    }

    let article = JSON.parse(record.content);

    console.log(`Finalizing article: ${article.title}`);

    // Iterate through paragraphs and sentences for TTS
    for (const paragraph of article.paragraphs) {
      for (const sentence of paragraph.sentences) {
        if (sentence.thai) {
          console.log(`Generating TTS for: ${sentence.thai.substring(0, 30)}...`);
          try {
            const audioBuffer = await generateThaiAudio(sentence.thai);
            const fileName = `${sentence.sentence_id}.mp3`;

            // Upload to Firebase Storage in 'audio' directory to match UI expectations
            await uploadAudioToStorage(audioBuffer, fileName, 'audio');

            // The audioURI in the JSON should match the path used by the UI (relative to storage bucket root)
            sentence.audioURI = `audio/${fileName}`;
          } catch (ttsError) {
            console.error(`TTS/Upload Error for "${sentence.thai}":`, ttsError);
          }
        }
      }
    }

    // Mark as completed and update local DB
    article.status = 'completed';
    updateArticle(id, article, 'completed');

    // Save final JSON to Firebase Realtime Database
    await saveArticleToFirebase(article);

    console.log(`Article ${id} finalized and synced to Firebase.`);

    res.json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    console.error('Error finalizing article:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/chat', async (req: any, res: any) => {
  const { message, sessionId = 'default' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    createSession(sessionId);
    const result = await geminiAgent.generate(message);
    saveMessage(sessionId, 'user', message);
    saveMessage(sessionId, 'assistant', result.text);
    res.json({ reply: result.text, sessionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/results', (req: any, res: any) => {
  const sessionId = req.query.sessionId as string;
  const type = req.query.type as string;
  const results = getResults(sessionId, type);
  res.json({ results });
});

app.get('/api/history/:sessionId', (req: any, res: any) => {
  const { sessionId } = req.params;
  const history = getMessages(sessionId);
  res.json({ history });
});

app.listen(port, () => {
  console.log(`Gemini Agent service running at http://localhost:${port}`);
});
