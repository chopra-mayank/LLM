import { z } from "zod";

// graph/state.js
export const itineraryStateSchema = z.object({
  userInput: z.object({
    location: z.string(),
    preferences: z.array(z.string()),
    numberOfPeople: z.number(),
    duration: z.object({
      type: z.enum(["hours", "days"]),
      value: z.number(),
    }),
  }),
  tweakPrompt: z.string().optional(), // ⬅️ Add this for dynamic changes
  rawActivitySuggestions: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  finalItinerary: z.object({
    duration: z.object({
      type: z.enum(["hours", "days"]),
      value: z.number(),
    }),
    days: z.array(
      z.object({
        dayNumber: z.number(),
        activities: z.array(z.object({ description: z.string() })),
      })
    ),
  }).optional(),
  nextAction: z.enum(["activity", "planner", "END", "tweak"]),
  error: z.string().optional(),
});
