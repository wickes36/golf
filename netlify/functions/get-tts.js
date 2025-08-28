// File: netlify/functions/get-tts.js

exports.handler = async function(event, context) {
  console.log("get-tts function invoked.");

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable not set.");
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }
    console.log("API Key found.");

    const { text } = JSON.parse(event.body);

    const payload = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API call failed with status: ${response.status}`, errorBody);
        throw new Error(`API call failed with status: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
        console.error("API returned no candidates in the response.");
        throw new Error("API returned no candidates in the response.");
    }
    
    const audioData = result.candidates[0].content.parts[0].inlineData.data;

    return {
      statusCode: 200,
      body: JSON.stringify({ audioData }),
    };

  } catch (error) {
    console.error('Error in get-tts function:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch TTS audio: ${error.message}` }),
    };
  }
};
