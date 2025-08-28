// File: netlify/functions/get-tts.js

exports.handler = async function(event, context) {
  // Only allow POST requests, which will contain the text to convert
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get the text from the game's request
    const { text } = JSON.parse(event.body);
    // Securely get your API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    // Prepare the request payload for the Gemini TTS API
    const payload = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    // Call the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    // Extract the audio data from the response
    const audioData = result.candidates[0].content.parts[0].inlineData.data;

    // Send the audio data back to the game
    return {
      statusCode: 200,
      body: JSON.stringify({ audioData }),
    };

  } catch (error) {
    console.error('Error in get-tts function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch TTS audio.' }),
    };
  }
};