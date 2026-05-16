const crypto = require('crypto');

let GEMINI_API_KEY = null;

function initGemini(apiKey) {
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn("WARNING: GEMINI_API_KEY is not set correctly. AI grading will fail.");
    }
    GEMINI_API_KEY = apiKey;
}

async function gradeHandwriting(base64Image, mimeType, currentDataJson) {
    if (!GEMINI_API_KEY) throw new Error("Gemini API not initialized.");

    const prompt = `
        You are an expert Thai language teacher. 
        I am providing a JSON array of Thai word objects (standard answers) and an image of a student's handwritten work.
        The student's worksheet follows the exact order of the JSON array.
        Standard Answers: ${currentDataJson}

        Your task:
        1. Perform OCR on the handwritten Thai words in the image.
        2. Compare each handwritten word with the 'thai' field in the corresponding JSON object.
        3. Calculate a total score (1 point per correct word).
        4. Identify specific errors: misspelled characters, wrong tone marks, or missing parts.
        5. Provide a summary comment.

        Output your response ONLY as a JSON object with this structure:
        {
            "score": number,
            "total": number,
            "summary": "string",
            "errors": [
                { "index": number, "expected": "string", "actual": "string", "mistake": "string" }
            ]
        }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Image
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.2
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        let text = result.candidates[0].content.parts[0].text;
        
        // Clean markdown JSON formatting if present
        text = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

module.exports = {
    initGemini,
    gradeHandwriting
};
