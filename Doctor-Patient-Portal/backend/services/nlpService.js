// File: backend/services/nlpService.js

const fetch = require('node-fetch');

/**
 * Analyzes comprehensive patient data to generate a detailed summary using the Gemini API.
 * @param {string} comprehensiveData - A formatted string containing the patient's full profile.
 * @returns {Promise<object>} A promise that resolves to the structured AI analysis.
 */
async function extractMedicalEntities(comprehensiveData) {
  const prompt = `
    You are a helpful medical assistant AI. Your task is to analyze a comprehensive set of patient data,
    including their profile, past diagnoses, prescription history, UPLOADED REPORTS, and recent chat conversations.
    Based on a holistic view of all this information, provide a structured and detailed clinical summary.

    The output must be in JSON format.

    Here is the patient's data:
    ---
    ${comprehensiveData}
    ---

    Analyze all the data provided and generate the following:
    1.  "overallSummary": A concise, professional paragraph summarizing the patient's current situation, key conditions, and recent concerns. Synthesize information from the profile, reports, and chat.
    2.  "keySymptoms": A list of key symptoms mentioned specifically in the recent chat history or noted in the uploaded reports.
    3.  "potentialRisks": A list of potential risks or complications the doctor should be aware of, based on the combination of chronic conditions, recent symptoms, medications, and findings from reports.
    4.  "followUpQuestions": A list of 3-4 pertinent questions the doctor could ask the patient to better understand their current condition, referencing details from the chat or reports.
  `;

  // ... (The rest of the function remains exactly the same)
  const chat = [{ role: "user", parts: [{ text: prompt }] }];
  const payload = {
    contents: chat,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          overallSummary: { type: "STRING" },
          keySymptoms: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          potentialRisks: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          followUpQuestions: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["overallSummary", "keySymptoms", "potentialRisks", "followUpQuestions"]
      }
    }
  };

  const apiKey = "AIzaSyDmqvZ50FFFl8BUE4NORudSgOjkJF2nkZY"; // This will be handled by the environment
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
      const jsonText = result.candidates[0].content.parts[0].text;
      return JSON.parse(jsonText);
    } else {
      console.error("Unexpected API response structure:", result);
      throw new Error("Failed to parse AI response.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

module.exports = { extractMedicalEntities };
