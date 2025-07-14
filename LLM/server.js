import express from "express";
import cors from "cors";
import itineraryRoute from "./routes/itinerary.js";
import  activity  from "./agents/travily.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/itinerary", itineraryRoute);
app.use("/api/tavily", activity);

const PORT = 5000;

app.listen(PORT, () => {
  
  console.log(`Server running on http://localhost:${PORT}`);
});
