// File: netlify/functions/get-pro-tip.js

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { holeNumber, par, distToPin, hazardsDescription, wind } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

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
        throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    const tip = result.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ tip }),
    };

  } catch (error) {
    console.error('Error in get-pro-tip function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch caddy tip.' }),
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
    const { text } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

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
        throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const audioData = result.candidates[0].content.parts[0].inlineData.data;

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
