import express from "express";
const router = express.Router();
import { itineraryGraph } from "../graph/graph.js";
import { tweakGraph } from "../graph/tweakGraph.js"; // 👈 Import new graph

// POST /api/itinerary
router.post("/", async (req, res) => {
  const { location, preferences, numberOfPeople, duration } = req.body;

  if (!location || !numberOfPeople || !duration?.type || !duration?.value) {
    return res.status(400).json({ error: "Missing required input fields." });
  }

  const initialState = {
    userInput: { location,preferences, numberOfPeople, duration },
    nextAction: "activity",
  };

  try {
    const result = await itineraryGraph.invoke(initialState);
    res.json(result);
  } catch (err) {
    console.error("LangGraph Error:", err);
    res.status(500).json({ error: "Workflow failed." });
  }
});


router.post("/tweak", async (req, res) => {
  const { finalItinerary, userInput, tweakPrompt } = req.body;

  if (!finalItinerary || !userInput || !tweakPrompt) {
    return res.status(400).json({ error: "Missing required tweak fields." });
  }

  const initialState = {
    userInput,        // ✅ One instance only
    finalItinerary,   // ✅ Only what's needed
    tweakPrompt,
    nextAction: "tweak",
  };

  try {
    const result = await tweakGraph.invoke(initialState);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ finalItinerary: result.finalItinerary });
  } catch (err) {
    console.error("Tweak Error:", err.message);
    res.status(500).json({ error: "Tweak workflow failed." });
  }
});

export default router;
