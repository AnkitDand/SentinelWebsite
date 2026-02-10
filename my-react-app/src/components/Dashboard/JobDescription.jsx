import React, { useState, useEffect } from "react";
import "./JobDescription.css";
import { Client } from "@gradio/client";
import JobAnalysisService from "./JobAnalysisService";

function JobDescription({ user, onJobDescriptionSubmit }) {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Load the most recent result for this user when component mounts
  useEffect(() => {
    if (user?.email) {
      const latestAnalysis = JobAnalysisService.getLatest(user.email);
      if (latestAnalysis) {
        setResult(latestAnalysis);
        setJobDescription(latestAnalysis.jobDescription);
      }
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }

    if (!user?.email) {
      setError("User session not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const client = await Client.connect(
        "https://ankitdand-sentinelxai.hf.space/",
      );
      const response = await client.predict("/analyze_text", {
        text: jobDescription,
      });

      console.log("API Response:", response.data);

      // Save using the service with USER EMAIL
      const analysisResult = JobAnalysisService.add(
        {
          confidence: response.data[0],
          shapExplanation: response.data[1],
          jobDescription: jobDescription,
        },
        user.email,
      );

      setResult(analysisResult);

      // Notify parent component
      if (onJobDescriptionSubmit) {
        onJobDescriptionSubmit(analysisResult);
      }
    } catch (err) {
      console.error("Error analyzing job description:", err);
      setError("Failed to analyze job description. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="job-description-container">
      <div className="job-description-content">
        {/* ... (rest of the JSX remains the same) ... */}
        <div className="header-section">
          <h1>Analyze Job Description</h1>
          <p className="page-subtitle">
            Enter the job description below to analyze for authenticity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="jd-form">
          <div className="form-group">
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows="12"
              className="jd-textarea"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                <span className="button-icon">🔍</span>
                Analyze Job Description
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="results-section">
            <h2>Analysis Results</h2>

            <div className="result-card confidence-card">
              <div className="result-header">
                <span className="result-icon">📊</span>
                <h3>Confidence Score</h3>
              </div>
              <div className="confidence-display">
                {result.confidence && typeof result.confidence === "object" ? (
                  <>
                    <div className="confidence-label">
                      {result.confidence.label || "N/A"}
                    </div>
                    {result.confidence.confidences &&
                      Array.isArray(result.confidence.confidences) && (
                        <div className="confidence-breakdown">
                          {result.confidence.confidences.map((conf, idx) => (
                            <div key={idx} className="confidence-item">
                              <span className="conf-label">{conf.label}:</span>
                              <div className="conf-bar-container">
                                <div
                                  className="conf-bar"
                                  style={{
                                    width: `${conf.confidence * 100}%`,
                                  }}></div>
                              </div>
                              <span className="conf-value">
                                {(conf.confidence * 100).toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                ) : (
                  <div className="confidence-value">{result.confidence}</div>
                )}
              </div>
            </div>

            <div className="result-card explanation-card">
              <div className="result-header">
                <span className="result-icon">🔬</span>
                <h3>SHAP Explanation</h3>
                <p className="explanation-subtitle">
                  Red = Suspicious | Blue = Trustworthy
                </p>
              </div>
              <div
                className="shap-content"
                dangerouslySetInnerHTML={{ __html: result.shapExplanation }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDescription;
