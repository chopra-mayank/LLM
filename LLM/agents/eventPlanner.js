import axios from "axios";
import dotenv from "dotenv";
import { getRainyDays } from "../utils/getRainyDays.js";
dotenv.config();

export async function eventPlanner(state) {
  console.log("Event Planner Running - Generating Itinerary with LLM...");

  const { userInput } = state;
  const { 
    location, 
    numberOfPeople, 
    duration, 
    preferences, 
    rainTolerance = "strict", 
    travelerType = "solo" 
  } = userInput;

  const travelerContext = {
    solo: `This is a solo traveler. Prioritize introspective experiences, personal enrichment (e.g., workshops, cultural immersions), and safety.`,
    family: `This group includes families with kids. Prioritize family-friendly, safe, educational, and interactive activities suitable for all ages.`,
    couple: `This is a couple on vacation. Suggest romantic experiences, private getaways, scenic spots, and intimate cultural experiences.`,
    adventure: `This group craves adrenaline. Prioritize adventure sports, treks, offbeat spots, and physically challenging experiences.`,
    luxury: `This is a luxury-seeking group. Recommend premium experiences: upscale dining, spas, private tours, exclusive attractions.`,
    senior: `This group consists of senior travelers. Prioritize comfortable pacing, accessibility, cultural richness, and relaxed environments.`,
  };

  const personaInstructions = travelerContext[travelerType] || "";

  const rainyDates = await getRainyDays(location);
  console.log("Rain is expected on these dates:", rainyDates);

  const startDate = new Date();
  const itineraryDates = [];

  for (let i = 0; i < duration.value; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    itineraryDates.push(date.toISOString().split("T")[0]);
  }

  const rainyDayNumbers = itineraryDates
    .map((date, index) => rainyDates.includes(date) ? index + 1 : null)
    .filter(num => num !== null);

  let weatherInstruction = "";
  if (rainyDayNumbers.length && rainTolerance === "strict") {
    weatherInstruction = `🚨 Weather Alert: Rain is expected on Day${rainyDayNumbers.length > 1 ? "s" : ""} ${rainyDayNumbers.join(", ")}.
Strictly avoid all outdoor activities like sightseeing, trekking, boating, or outdoor walks on these days.
Focus entirely on indoor experiences like museums, shopping centers, indoor workshops, or indoor team events.\n\n`;
  } else if (rainyDayNumbers.length && rainTolerance === "flexible") {
    weatherInstruction = `🌦️ Note: Rain is expected on Day${rainyDayNumbers.length > 1 ? "s" : ""} ${rainyDayNumbers.join(", ")}.
Try to minimize outdoor time — opt for nearby or partially covered attractions.
✅ On these days, include both:
- A **primary** activity (outdoor/flexible)
- A **backup** indoor activity, clearly marked as "(indoor backup)"

Example:
1. Visit Dumas Beach for a morning walk. (morning)  
2. Indoor Backup: Explore Surat Museum in case of heavy rain. (indoor backup)\n\n`;
  } else if (rainyDayNumbers.length && rainTolerance === "ignore") {
    weatherInstruction = `☔ FYI: Rain is forecasted on Day${rainyDayNumbers.length > 1 ? "s" : ""} ${rainyDayNumbers.join(", ")}.
The user has chosen to **ignore weather constraints**.
✅ Plan the itinerary **as if the weather is clear** — include **outdoor activities** normally (e.g., beach, trekking, walking tours, rafting, etc.), even on rainy days.
Do **not reduce or eliminate outdoor activities** just because rain is expected.\n\n`;
  }

  const prompt = `
You are an expert event planner specializing in creating detailed day-wise itineraries for corporate events.
Based on the following inputs, generate a detailed, day-wise itinerary of places and activities.

🧾 **User Input:**

- **Location:** ${location}
- **Number of People:** ${numberOfPeople}
- **Trip Duration:** ${duration.value} ${duration.type}
- **User Preferences:** ${preferences.join(", ")}
- **Rain Tolerance Mode:** ${rainTolerance}
- **Known Weather Forecast:** ${weatherInstruction}
👤 **Traveler Type Context:** ${personaInstructions}

---
🎯 **Key Guidelines:**

✅ **Activity Selection:**
- Prioritize **unique**, **famous**, **highly-rated** places or experiences **specific to ${location}**.
- Focus on **hidden gems**, **cultural experiences**, and **top-rated activities** based on preferences.
- If available, include any **local festivals**, **seasonal events**, or **time-sensitive attractions** relevant during the trip dates.
- Avoid generic or repetitive suggestions (e.g., don't recommend "visit a local mall" multiple times).

🧠 **Intelligent Diversity**:
- Make each day **distinct**, themed if possible (e.g., Heritage Day, Nature Day, Food Discovery).
- Mix indoor and outdoor activities strategically based on the forecast.

🔁 **Uniqueness Rules**:
- No activity or description should repeat across days — all 15 activities must be **completely unique**.
- Avoid suggesting very similar-sounding activities (e.g., multiple museums or markets unless significantly different).

☔ **Weather Logic** (especially for rainy days):
- If it's a **rainy day** AND **rainTolerance is "flexible"**, include:
  1. A primary (possibly outdoor) activity
  2. A clear indoor **backup activity**, labeled with **(indoor backup)**

---
🧾 **Itinerary Format (MANDATORY)**:
- Generate **exactly ${duration.value} day(s)** in total.
- Title each day: **Day X**
- List **exactly 3 activities** per day (no more, no less)
- Each activity should include the time of day in parentheses: **(morning), (afternoon), or (evening)**
- If it's a rainy day in flexible mode, format as follows:

**Example:**
Day 2  
1. Visit the Dutch Garden for historical architecture. (morning)  
2. Indoor Backup: Explore the Sardar Patel Museum. (indoor backup)  
3. Take a textile workshop at an artisan center. (evening)

---
📦 **Output only the day-wise itinerary. No introduction or conclusion.**

Make it exciting, personalized, and tailored to ${location}'s unique offerings!
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
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
    const lines = rawText.split("\n").map(line => line.trim()).filter(Boolean);

    const parsedDays = [];
    let currentDayNumber = 0;
    let currentDayActivities = [];
    const rawActivitySuggestions = [];

    for (const line of lines) {
      const dayMatch = line.match(/^\*?\*?Day (\d+)\*?\*?$/i);
      if (dayMatch) {
        if (currentDayActivities.length > 0) {
          parsedDays.push({ dayNumber: currentDayNumber, activities: currentDayActivities });
        }
        currentDayNumber = parseInt(dayMatch[1]);
        currentDayActivities = [];
      } else if (/^(\d+\.|[-•])/.test(line)) {
        const cleanedLine = line.replace(/^\d+\.\s*|[-•]\s*/, "").trim();
        const timeMatch = cleanedLine.match(/\((morning|afternoon|evening|indoor backup)\)$/i);
        const timeOfDay = timeMatch ? timeMatch[1].toLowerCase() : undefined;
        const description = cleanedLine.replace(/\s*\((morning|afternoon|evening|indoor backup)\)$/i, "").trim();
        currentDayActivities.push({ description, timeOfDay });
        rawActivitySuggestions.push(description);
      }
    }
    
    if (currentDayActivities.length > 0) {
      parsedDays.push({ dayNumber: currentDayNumber, activities: currentDayActivities });
    }

    function isOutdoor(activity) {
      const desc = activity.description.toLowerCase();
      return /(trek|beach|boating|walk|hike|garden|outdoor|forest|camp|sunset|lake|photography|wildlife|park|open-air)/.test(desc);
    }
    
    function countOutdoorActivities(day) {
      return day.activities.filter(isOutdoor).length;
    }

    if (rainTolerance !== "ignore" && rainyDayNumbers.length) {
      const sortedDays = [...parsedDays].sort((a, b) => countOutdoorActivities(b) - countOutdoorActivities(a));
      const reordered = Array(parsedDays.length).fill(null);
      let rainyIdx = 0, clearIdx = 0;

      sortedDays.forEach((day) => {
        const outdoorCount = countOutdoorActivities(day);
        const isFlexible = rainTolerance === "flexible" && outdoorCount <= 1;
        let assignIndex;

        if ((rainTolerance === "strict" || isFlexible) && rainyIdx < rainyDayNumbers.length) {
          assignIndex = rainyDayNumbers[rainyIdx++] - 1;
        } else {
          while (rainyDayNumbers.includes(clearIdx + 1)) clearIdx++;
          assignIndex = clearIdx++;
        }

        reordered[assignIndex] = day;
      });

      let fallbackIdx = 0;
      for (let i = 0; i < reordered.length; i++) {
        if (!reordered[i]) {
          while (reordered.includes(sortedDays[fallbackIdx])) fallbackIdx++;
          reordered[i] = sortedDays[fallbackIdx++];
        }
      }

      parsedDays.length = 0;
      reordered.forEach((day, i) => {
        parsedDays.push({ ...day, dayNumber: i + 1 });
      });
    }

    const suggestions = [...new Set(rawActivitySuggestions.filter(s => s.length > 20))].slice(0, 10);

    const finalItinerary = {
      duration,
      days: parsedDays.map(day => ({
        ...day,
        weather: rainyDayNumbers.includes(day.dayNumber) ? "rainy" : "clear",
      }))
    };

    return {
      ...state,
      finalItinerary,
      suggestions,
      userInput,
      nextAction: "END",
      error: undefined,
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