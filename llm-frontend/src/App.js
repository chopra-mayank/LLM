import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./App.css";

export default function App() {
  const [formData, setFormData] = useState({
    location: "",
    preferences: "",
    numberOfPeople: 1,
    durationType: "days",
    durationValue: 1,
  });

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const cityFromURL = params.get("city");
  if (cityFromURL) {
    setFormData((prev) => ({ ...prev, location: cityFromURL }));
  }
}, []);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numberOfPeople" || name === "durationValue" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim() || !formData.preferences.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:5000/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formData.location,
          preferences: formData.preferences.split(",").map((p) => p.trim()),
          numberOfPeople: formData.numberOfPeople,
          duration: {
            type: formData.durationType,
            value: formData.durationValue,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate itinerary");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 to-indigo-200 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-600">Travel Itinerary Generator</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Location</label>
            <input
              type="text"
              name="location"
              className="w-full border p-2 rounded"
              placeholder="e.g., Udaipur, Rajasthan"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block font-medium">Preferences (comma separated)</label>
            <input
              type="text"
              name="preferences"
              className="w-full border p-2 rounded"
              placeholder="e.g., heritage, business"
              value={formData.preferences}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block font-medium">Number of People</label>
            <input
              type="number"
              name="numberOfPeople"
              className="w-full border p-2 rounded"
              min={1}
              value={formData.numberOfPeople}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block font-medium">Duration</label>
            <div className="flex gap-4">
              <select
                name="durationType"
                className="border p-2 rounded"
                value={formData.durationType}
                onChange={handleChange}
              >
                <option value="days">Days</option>
                <option value="hours">Hours</option>
              </select>
              <input
                type="number"
                name="durationValue"
                className="w-full border p-2 rounded"
                min={1}
                value={formData.durationValue}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold p-2 rounded hover:bg-indigo-700 transition"
          >
            {loading ? "Generating..." : "Generate Itinerary"}
          </button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-green-50 p-4 rounded-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Your Itinerary</h2>
            {result.finalItinerary.days.map((day, i) => (
              <div key={i} className="mb-4">
                <h3 className="font-bold">Day {day.dayNumber}</h3>
                <ul className="list-disc ml-5 text-sm">
                  {day.activities.map((a, idx) => (
                    <li key={idx}>{a.description}</li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
