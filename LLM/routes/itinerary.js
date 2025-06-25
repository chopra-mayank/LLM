import express from "express";
const router = express.Router();
import { itineraryGraph } from "../graph/graph.js";

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

export default router;
