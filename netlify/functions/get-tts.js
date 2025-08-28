// File: netlify/functions/get-pro-tip.js

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // Check if the API key is available
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }

    const { holeNumber, par, distToPin, hazardsDescription, wind } = JSON.parse(event.body);

    const systemPrompt = "You are a professional golf caddy named 'Ace'. Your goal is to provide a brief, encouraging, and strategic tip for playing a golf hole based on its layout. Analyze the hazards and suggest a smart play. Keep your advice to 2-3 short sentences. Be direct and start with your recommendation.";
    const userQuery = `Ace, I'm on Hole ${holeNumber}, a ${distToPin} yard Par ${par}. ${hazardsDescription} The wind is ${wind}. What's the play?`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API call failed with status: ${response.status} - ${errorBody}`);
    }
    
    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("API returned no candidates in the response.");
    }
    
    const tip = result.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ tip }),
    };

  } catch (error) {
    console.error('Error in get-pro-tip function:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch caddy tip: ${error.message}` }),
    };
  }
};
```javascript
// File: netlify/functions/get-tts.js

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // Check if the API key is available
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set.");
    }

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
        throw new Error(`API call failed with status: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
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
