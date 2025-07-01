import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

export default function App() {
  const [formData, setFormData] = useState({
    location: "",
    preferences: "",
    numberOfPeople: 1,
    durationType: "days",
    durationValue: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cityFromURL = params.get("city");
    const hotelFromURL = params.get("hotel");
    
    if (cityFromURL) {
      setFormData((prev) => ({ 
        ...prev, 
        location: cityFromURL,
        preferences: hotelFromURL ? `hotel stay at ${hotelFromURL}, sightseeing` : ""
      }));
    }
  }, []);

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
    setShowResult(false);

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
      setTimeout(() => setShowResult(true), 500);
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
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
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📍</span>
                Destination
              </label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="e.g., Udaipur, Rajasthan"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">👥</span>
                Number of Travelers
              </label>
              <div className="number-selector">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, numberOfPeople: Math.max(1, prev.numberOfPeople - 1) }))}
                  className="number-btn"
                >
                  -
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
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">⏰</span>
                Trip Duration
              </label>
              <div className="duration-selector">
                <select
                  name="durationType"
                  className="duration-type"
                  value={formData.durationType}
                  onChange={handleChange}
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
                <input
                  type="number"
                  name="durationValue"
                  className="duration-value"
                  min={1}
                  value={formData.durationValue}
                  onChange={handleChange}
                  required
                />
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
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🎯</span>
                Travel Preferences
              </label>
              <textarea
                name="preferences"
                className="form-textarea"
                placeholder="e.g., heritage sites, local cuisine, adventure activities, shopping, nightlife"
                value={formData.preferences}
                onChange={handleChange}
                rows={4}
                required
              />
              <div className="preference-tags">
                {['Heritage', 'Adventure', 'Food', 'Shopping', 'Nature', 'Culture'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="preference-tag"
                    onClick={() => {
                      const current = formData.preferences;
                      const newPref = current ? `${current}, ${tag.toLowerCase()}` : tag.toLowerCase();
                      setFormData(prev => ({ ...prev, preferences: newPref }));
                    }}
                  >
                    {tag}
                  </button>
                ))}
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
      <div className="loading-container">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="loading-content"
        >
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h2 className="loading-title">Crafting Your Perfect Itinerary</h2>
          <p className="loading-subtitle">Analyzing destinations and creating personalized experiences...</p>
          <div className="loading-steps">
            {['Analyzing preferences', 'Finding attractions', 'Optimizing routes', 'Adding local insights'].map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.5 }}
                className="loading-step"
              >
                ✨ {step}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="result-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="result-header"
        >
          <h1 className="result-title">
            <span className="title-icon">🗺️</span>
            Your {formData.location} Adventure
          </h1>
          <div className="result-meta">
            <div className="meta-item">
              <span className="meta-icon">👥</span>
              {formData.numberOfPeople} {formData.numberOfPeople === 1 ? 'Traveler' : 'Travelers'}
            </div>
            <div className="meta-item">
              <span className="meta-icon">⏰</span>
              {formData.durationValue} {formData.durationType}
            </div>
          </div>
        </motion.div>

        <div className="timeline-container">
          {result.finalItinerary.days.map((day, index) => (
            <motion.div
              key={day.dayNumber}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="timeline-day"
            >
              <div className="timeline-marker">
                <div className="timeline-dot"></div>
                <div className="timeline-line"></div>
              </div>
              <div className="timeline-content">
                <div className="day-header">
                  <h3 className="day-title">Day {day.dayNumber}</h3>
                  <div className="day-badge">{day.activities.length} Activities</div>
                </div>
                <div className="activities-grid">
                  {day.activities.map((activity, actIndex) => (
                    <motion.div
                      key={actIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index * 0.2) + (actIndex * 0.1) }}
                      className="activity-card"
                    >
                      <div className="activity-icon">
                        {activity.description.toLowerCase().includes('food') || activity.description.toLowerCase().includes('restaurant') ? '🍽️' :
                         activity.description.toLowerCase().includes('temple') || activity.description.toLowerCase().includes('palace') ? '🏛️' :
                         activity.description.toLowerCase().includes('market') || activity.description.toLowerCase().includes('shopping') ? '🛍️' :
                         activity.description.toLowerCase().includes('lake') || activity.description.toLowerCase().includes('water') ? '🏞️' :
                         activity.description.toLowerCase().includes('hotel') ? '🏨' : '📍'}
                      </div>
                      <div className="activity-content">
                        <p className="activity-description">{activity.description}</p>
                        {activity.time && (
                          <div className="activity-time">
                            <span className="time-icon">⏰</span>
                            {activity.time}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
            }}
            className="action-btn secondary"
          >
            Create New Itinerary
          </button>
          <button
            onClick={() => window.print()}
            className="action-btn primary"
          >
            <span className="btn-icon">🖨️</span>
            Print Itinerary
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="form-container"
      >
        <div className="form-header">
          <h1 className="form-title">
            <span className="title-icon">✨</span>
            Itinerary Generator
          </h1>
          <div className="step-indicator">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`step-dot ${currentStep >= step ? 'active' : ''}`}
              >
                {currentStep > step ? '✓' : step}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-message"
            >
              <span className="error-icon">⚠️</span>
              {error}
            </motion.div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="action-btn secondary"
              >
                ← Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="action-btn primary"
                disabled={
                  (currentStep === 1 && !formData.location.trim()) ||
                  (currentStep === 2 && !formData.durationValue)
                }
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="action-btn primary generate-btn"
                disabled={!formData.preferences.trim()}
              >
                <span className="btn-icon">🚀</span>
                Generate Itinerary
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}