// graph/graph.js
import { StateGraph } from "@langchain/langgraph";
import { itineraryStateSchema } from "./state.js";
import { activitySuggestor } from "../agents/activitySuggestor.js";
import { eventPlanner } from "../agents/eventplanner.js";

// ✅ Pass schema here
const graph = new StateGraph(itineraryStateSchema);

graph.addNode("activity", activitySuggestor);
graph.addNode("planner", eventPlanner);

graph.addEdge("activity", "planner");
graph.addEdge("planner", "__end__");

// Set entry point
graph.addEdge("__start__", "activity")


export const itineraryGraph = graph.compile();
