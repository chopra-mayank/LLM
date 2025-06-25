import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function activitySuggestor(state) {
  console.log("Activity Suggester Running...");

  // Ensure userInput is correctly destructured from the state object
  const { preferences, numberOfPeople, duration, location } = state.userInput;

  if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
    console.error("Validation Error: Missing or invalid preferences.");
    return {
      ...state, // Return existing state to maintain other data
      error: "Missing or invalid preferences in user input. Please provide at least one preference.",
      nextAction: "END",
    };
  }

  const prompt = `
You are an expert event planner specializing in team-building activities. Based on the following inputs, suggest 3-5 highly suitable and engaging team-building activities.

---
**User Input:**
* **Location:** ${location}
* **Number of People:** ${numberOfPeople}
* **Duration:** ${duration.value} ${duration.type}
* **Preferences:** ${preferences.join(", ")} (e.g., active, creative, problem-solving, relaxed, competitive, indoor, outdoor, game-based)

---
**Instructions for Output:**
Provide only a plain, unnumbered list of 3-5 team-building activity names. Do not include any introductory or concluding sentences, explanations, or additional text. Each activity name should be specific and clearly indicate a team-building element.
Give only relevant information according to location 
---
**Example of Desired Output Format:**
* Laser Tag Team Challenge 
* Escape Room: "The Heist"
* Group Canvas Painting in the third space 
* Outdoor Scavenger Hunt 
* Build-A-Bridge Engineering Contest 

`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192", // Use this model
        messages: [
          {
            role: "system",
            content: "You are a helpful and concise team-building activity generator.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    const rawText = response.data.choices[0].message.content;
    const suggestions = rawText
      .split("\n")
      .map((line) => line.replace(/^\*\s*/, "").trim()) // Removed /\d+\.\s*/ and used /^\*\s*/ for bullet points
      .filter(Boolean); // Filter out any empty strings resulting from blank lines

    console.log("Activity Suggestions fetched successfully.");
    return {
      ...state, // Return existing state
      rawActivitySuggestions: rawText, // Store the raw text
      suggestions, // Store the parsed list
      nextAction: "planner", // Move to the next step
      error: undefined, // Clear any previous errors
    };
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    return {
      ...state, // Return existing state
      error: `Failed to fetch activity suggestions: ${error.response?.data?.error?.message || error.message}`,
      nextAction: "END", // End the process on API failure
    };
  }
}