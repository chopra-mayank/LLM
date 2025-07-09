import { StateGraph } from "@langchain/langgraph";
import { itineraryStateSchema } from "./state.js";
import { tweakAgent } from "../agents/tweakAgent.js";

const tweakGraphBuilder = new StateGraph(itineraryStateSchema);

tweakGraphBuilder.addNode("tweak", tweakAgent);
tweakGraphBuilder.addEdge("__start__", "tweak");

export const tweakGraph = tweakGraphBuilder.compile();
