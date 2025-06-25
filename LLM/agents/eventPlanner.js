import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function eventPlanner(state) {
  console.log("Event Planner Running - Generating Itinerary with LLM...");

  const { userInput } = state;
  const { location, numberOfPeople, duration, preferences } = userInput;

  // Construct the prompt for the LLM to generate the itinerary
const prompt = `
You are an expert event planner specializing in creating detailed day-wise itineraries for corporate events.
Based on the following inputs, generate a precise, day-wise itinerary of places and activities.

---
**User Input:**
* **Location:** ${location}
* **Number of People:** ${numberOfPeople}
* **Duration:** ${duration.value} ${duration.type}
* **Preferences:** ${preferences.join(", ")}

---
**Instructions for Output:**
Provide the itinerary as a plain text, structured day-wise. For each day, list 1-3 highly suitable activities/places.
The output should ONLY contain the itinerary, formatted as follows, without any introductory or concluding sentences.

**Example Output Format for a 2-day event:**
Day 1
1. Visit City Palace for a historic tour and panoramic views.
2. Experience a serene boat ride on Lake Pichola.
3. Attend a cultural folk music and dance performance at Bagore Ki Haveli.
Day 2
1. Explore Sajjangarh Monsoon Palace for breathtaking sunset views.
2. Participate in a traditional Rajasthani cooking workshop.
3. Enjoy a team dinner at a luxury lakeside restaurant.
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192", // Using llama3-70b-8192 as requested
        messages: [
          {
            role: "system",
            content: "You are a highly detailed and structured itinerary generator for corporate events.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7, // Adjust temperature for creativity vs. consistency
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // Ensure this is available
        },
      }
    );

    const rawItineraryText = response.data.choices[0].message.content;
    // console.log("Raw Itinerary Text from LLM:\n", rawItineraryText);

    // Parse the raw itinerary text into the structured format
    const parsedDays = [];
    const lines = rawItineraryText.split('\n').filter(line => line.trim() !== '');

    let currentDayActivities = [];
    let currentDayNumber = 0;

    for (const line of lines) {
      if (line.startsWith('Day ')) {
        // If there are activities from the previous day, save them
        if (currentDayActivities.length > 0) {
          parsedDays.push({
            dayNumber: currentDayNumber,
            activities: currentDayActivities,
          });
        }
        // Start a new day
        currentDayNumber = parseInt(line.replace('Day ', '').trim());
        currentDayActivities = [];
      } else if (line.match(/^\d+\.\s/)) {
        // This is an activity line
        currentDayActivities.push({
          description: line.replace(/^\d+\.\s*/, '').trim(),
        });
      }
    }
    // Add the last day's activities
    if (currentDayActivities.length > 0) {
      parsedDays.push({
        dayNumber: currentDayNumber,
        activities: currentDayActivities,
      });
    }

    const finalItinerary = {
      duration: userInput.duration, // Keep the duration from userInput
      days: parsedDays,
    };

    return {
      ...state, // Preserve existing state
      finalItinerary: finalItinerary,
      nextAction: "END", // End the workflow after generating the itinerary
      error: undefined, // Clear any errors
    };
  } catch (error) {
    console.error("Groq API Error in Event Planner:", error.response?.data || error.message);
    return {
      ...state,
      error: `Failed to generate itinerary: ${error.response?.data?.error?.message || error.message}`,
      nextAction: "END",
    };
  }
}