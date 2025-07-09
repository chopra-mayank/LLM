import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

export default function App() {
  const [addedSuggestions, setAddedSuggestions] = useState([]);
  
  const getInitialFormData = () => {
    const params = new URLSearchParams(window.location.search);
    const cityFromURL = params.get("city");
    const hotelFromURL = params.get("hotel");
    const autoPreferences = hotelFromURL ? `hotel stay at ${hotelFromURL}, sightseeing` : "";
    return {
      location: cityFromURL || "",
      preferences: "", 
      autoPreferences, 
      numberOfPeople: 1,
      durationType: "days",
      durationValue: 1,
    };
  };
  const [tweakPrompt, setTweakPrompt] = useState("");
const [tweaking, setTweaking] = useState(false);

  const [formData, setFormData] = useState(getInitialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showResult, setShowResult] = useState(false);

  const handleMoveUp = (dayIndex, actIndex) => {
    const updatedResult = { ...result };
    const day = updatedResult.finalItinerary.days[dayIndex];

    if (actIndex > 0) {
      [day.activities[actIndex - 1], day.activities[actIndex]] =
        [day.activities[actIndex], day.activities[actIndex - 1]];
      setResult(updatedResult);
    }
  };

  const handleRemoveActivity = (dayIndex, actIndex) => {
    const updatedResult = { ...result };
    const day = updatedResult.finalItinerary.days[dayIndex];
    const removed = day.activities.splice(actIndex, 1);

    if (removed.length && removed[0].description) {
      setAddedSuggestions(prev =>
        prev.filter((s) => s !== removed[0].description)
      );
    }

    setResult(updatedResult);
  };

  const handleAddSuggestion = (suggestionText, dayNum) => {
    if (![1, 2, 3].includes(dayNum)) return;

    const updatedResult = { ...result };
    const targetDay = updatedResult.finalItinerary.days.find(d => d.dayNumber === dayNum);

    if (!targetDay) return;

    const alreadyExists = targetDay.activities.some(
      (act) => act.description.toLowerCase() === suggestionText.toLowerCase()
    );

    if (alreadyExists) return;

    targetDay.activities.push({ description: suggestionText });

    setResult(updatedResult);
    setAddedSuggestions(prev => [...prev, suggestionText]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError("");
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numberOfPeople" || name === "durationValue" ? Number(value) : value,
    }));
  };

  const handleTweakSubmit = async () => {
  if (!tweakPrompt.trim() || !result) return;

  setTweaking(true);
  try {
    const res = await fetch("http://localhost:5000/api/itinerary/tweak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        finalItinerary: result.finalItinerary,
        userInput: result.userInput,
        tweakPrompt: tweakPrompt,
      }),
    });

    if (!res.ok) throw new Error("Tweak failed");
    const updated = await res.json();
    setResult((prev) => ({
      ...prev,
      finalItinerary: updated.finalItinerary,
    }));
    setTweakPrompt(""); // clear input
  } catch (err) {
    alert("Error tweaking itinerary. Please try again.");
    console.error("Tweak Error:", err);
  } finally {
    setTweaking(false);
  }
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
    setShowResult(false);

    try {
      const res = await fetch("http://localhost:5000/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formData.location,
          preferences: (formData.preferences || formData.autoPreferences).split(",").map((p) => p.trim()),
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
      setTimeout(() => setShowResult(true), 500);
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 3) {
      if (!(formData.preferences.trim() || formData.autoPreferences.trim())) {
        setError("Please fill out travel preferences.");
        return;
      }
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="step-content"
          >
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">📍</span>
                Where would you like to explore?
              </label>
              <input
                type="text"
                name="location"
                className="modern-input"
                placeholder="Enter your dream destination..."
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">👥</span>
                How many travelers?
              </label>
              <div className="number-selector">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: Math.max(1, prev.numberOfPeople - 1) }))}
                  className="number-btn"
                  disabled={formData.numberOfPeople <= 1}
                >
                  −
                </button>
                <span className="number-display">{formData.numberOfPeople}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: prev.numberOfPeople + 1 }))}
                  className="number-btn"
                >
                  +
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="step-content"
          >
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">⏰</span>
                How long is your adventure?
              </label>
              <div className="duration-container">
                <div className="duration-input-wrapper">
                  <input
                    type="number"
                    name="durationValue"
                    className="duration-input"
                    min={1}
                    value={formData.durationValue}
                    onChange={handleChange}
                    required
                  />
                  <select
                    name="durationType"
                    className="duration-select"
                    value={formData.durationType}
                    onChange={handleChange}
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="step-content"
          >
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">🎯</span>
                What experiences excite you?
              </label>
              <textarea
                name="preferences"
                className="modern-textarea"
                placeholder="e.g., heritage sites, local cuisine, shopping, nightlife"
                value={formData.preferences}
                onChange={handleChange}
                rows={4}
                required
              />
              <div className="preference-tags">
                {['Heritage', 'Adventure', 'Food', 'Shopping', 'Nature', 'Culture', 'Nightlife', 'Photography'].map(tag => (
                  <motion.button
                    key={tag}
                    type="button"
                    className="preference-tag"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const current = formData.preferences;
                      const newPref = current ? `${current}, ${tag.toLowerCase()}` : tag.toLowerCase();
                      setFormData(prev => ({ ...prev, preferences: newPref }));
                    }}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="step-content review-step"
          >
            <h2 className="review-title">🧾 Your Adventure Awaits</h2>
            <div className="review-details">
              <div className="review-item">
                <div className="review-icon">📍</div>
                <div>
                  <span className="review-label">Destination</span>
                  <span className="review-value">{formData.location}</span>
                </div>
              </div>
              <div className="review-item">
                <div className="review-icon">👥</div>
                <div>
                  <span className="review-label">Travelers</span>
                  <span className="review-value">{formData.numberOfPeople} {formData.numberOfPeople === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
              <div className="review-item">
                <div className="review-icon">⏰</div>
                <div>
                  <span className="review-label">Duration</span>
                  <span className="review-value">{formData.durationValue} {formData.durationType}</span>
                </div>
              </div>
              <div className="review-item">
                <div className="review-icon">🎯</div>
                <div>
                  <span className="review-label">Experiences</span>
                  <span className="review-value">{formData.preferences || formData.autoPreferences}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="loading-card"
        >
          <div className="loading-animation">
            <div className="globe">🌍</div>
            <div className="orbit">
              <div className="satellite">✈️</div>
            </div>
          </div>
          <h2 className="loading-title">Crafting Your Perfect Journey</h2>
          <p className="loading-subtitle">Our AI is analyzing the best experiences for you...</p>
          <div className="loading-progress">
            <motion.div 
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="result-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="result-header"
        >
          <h1 className="result-title">
            <span className="title-emoji">🗺️</span>
            Your {formData.location} Adventure
          </h1>
          <div className="result-meta">
            <div className="meta-badge">
              <span>👥</span>
              {formData.numberOfPeople} {formData.numberOfPeople === 1 ? 'Traveler' : 'Travelers'}
            </div>
            <div className="meta-badge">
              <span>⏰</span>
              {formData.durationValue} {formData.durationType}
            </div>
          </div>
        </motion.div>

        <div className="timeline">
          {result.finalItinerary.days.map((day, index) => (
            <motion.div
              key={day.dayNumber}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="day-card"
            >
              <div className="day-header">
                <div className="day-number">Day {day.dayNumber}</div>
                <div className="activity-count">{day.activities.length} experiences</div>
              </div>
              <div className="activities">
                {day.activities.map((activity, actIndex) => (
                  <motion.div
                    key={actIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index * 0.2) + (actIndex * 0.1) }}
                    className="activity"
                  >
                    <div className="activity-icon">
                      {activity.description.toLowerCase().includes('food') || activity.description.toLowerCase().includes('restaurant') ? '🍽️' :
                        activity.description.toLowerCase().includes('temple') || activity.description.toLowerCase().includes('palace') ? '🏛️' :
                        activity.description.toLowerCase().includes('market') || activity.description.toLowerCase().includes('shopping') ? '🛍️' :
                        activity.description.toLowerCase().includes('lake') || activity.description.toLowerCase().includes('water') ? '🏞️' :
                        activity.description.toLowerCase().includes('hotel') ? '🏨' : '📍'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">{activity.description}</p>
                      <div className="activity-actions">
                        <button
                          onClick={() => handleMoveUp(index, actIndex)}
                          disabled={actIndex === 0}
                          className="action-btn move-up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleRemoveActivity(index, actIndex)}
                          className="action-btn remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {result.suggestions && result.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="suggestions-card"
          >
            <div className="tweak-box" style={{ marginTop: "2rem" }}>
  <h3>✏️ Tweak Itinerary</h3>
  <input
    type="text"
    placeholder="e.g., Make Day 2 more relaxing"
    value={tweakPrompt}
    onChange={(e) => setTweakPrompt(e.target.value)}
    className="form-input"
  />
  {tweaking && (
  <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
    ✨ Applying your changes...
  </p>
)}
  <button
    className="action-btn"
    onClick={handleTweakSubmit}
    disabled={!tweakPrompt.trim()}
    style={{ marginLeft: "1rem" }}
  >
    🔄 Apply Tweak
  </button>
</div>

            <h2 className="suggestions-title">🧠 More Amazing Experiences</h2>
            <div className="suggestions-list">
              {result.suggestions.map((item, index) => {
                const isAlreadyAdded = addedSuggestions.includes(item);
                return (
                  <div key={index} className="suggestion-item">
                    <span className="suggestion-text">✨ {item}</span>
                    <select
                      disabled={isAlreadyAdded}
                      onChange={(e) => {
                        const dayNum = parseInt(e.target.value);
                        handleAddSuggestion(item, dayNum);
                      }}
                      defaultValue=""
                      className="add-to-day-select"
                    >
                      <option value="" disabled>
                        Add to Day
                      </option>
                      {[1, 2, 3].map(day => (
                        <option key={day} value={day}>Day {day}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="result-actions"
        >
          <button
            onClick={() => {
              setResult(null);
              setShowResult(false);
              setCurrentStep(1);
              setFormData(getInitialFormData());
            }}
            className="secondary-btn"
          >
            Create New Journey
          </button>
          <button
            onClick={() => window.print()}
            className="primary-btn"
          >
            <span>🖨️</span>
            Print Itinerary
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="background-pattern"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="form-card"
      >
        <div className="form-header">
          <motion.h1 
            className="app-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="title-gradient">✨ Journey Planner</span>
          </motion.h1>
          <motion.p 
            className="app-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Create unforgettable travel experiences powered by AI
          </motion.p>
          
          <div className="step-progress">
            {[1, 2, 3, 4].map((step) => (
              <motion.div
                key={step}
                className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 * step }}
              >
                {currentStep > step ? '✓' : step}
              </motion.div>
            ))}
            <div className="progress-line">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>

        <div className="form">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-alert"
            >
              <span className="error-icon">⚠️</span>
              {error}
            </motion.div>
          )}

          <div className="form-navigation">
            {currentStep > 1 && (
              <motion.button
                type="button"
                onClick={prevStep}
                className="nav-btn secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Back
              </motion.button>
            )}

            {currentStep < 4 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                className="nav-btn primary"
                disabled={
                  (currentStep === 1 && !formData.location.trim()) ||
                  (currentStep === 2 && !formData.durationValue) ||
                  (currentStep === 3 && !(formData.preferences.trim() || formData.autoPreferences.trim()))
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue →
              </motion.button>
            ) : (
              <motion.button
                type="button"
                className="nav-btn generate"
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="btn-icon">🚀</span>
                Create My Journey
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}