// agents/tweakAgent.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function tweakAgent(state) {
  console.log("Tweak Agent Running...");

  const { finalItinerary, userInput, tweakPrompt } = state;

  if (!tweakPrompt || !finalItinerary) {
    return {
      ...state,
      error: "Missing tweak prompt or itinerary to edit.",
      nextAction: "END",
    };
  }

  const llmPrompt = `
You are a professional corporate travel planner. Based on the user's request, revise the following itinerary while preserving structure and realism.

---
**User Request:**
${tweakPrompt}

**User Input:**
Location: ${userInput.location}
People: ${userInput.numberOfPeople}
Duration: ${userInput.duration.value} ${userInput.duration.type}
Preferences: ${userInput.preferences.join(", ")}

**Original Itinerary JSON:**
${JSON.stringify(finalItinerary, null, 2)}

---
**Instructions:**
- Output valid JSON.
- Only update relevant days or activities based on the request.
- Do not rewrite the entire itinerary unless required.
- Maintain this exact schema:
{
  "duration": { "type": "days", "value": 3 },
  "days": [
    {
      "dayNumber": 1,
      "activities": [
        { "description": "..." },
        ...
      ]
    },
    ...
  ]
}
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: "You are a meticulous and professional travel itinerary editor." },
          { role: "user", content: llmPrompt },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();

    // Try-catch JSON parsing explicitly
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (jsonErr) {
      console.error("Invalid JSON from LLM:", content);
      throw new Error("LLM output is not valid JSON.");
    }

    return {
      ...state,
      finalItinerary: parsed,
      nextAction: "END",
      error: undefined,
    };
  } catch (err) {
    console.error("Tweak Agent Error:", err.response?.data || err.message);
    return {
      ...state,
      error: "Tweak Agent failed to update the itinerary.",
      nextAction: "END",
    };
  }
}
