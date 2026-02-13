import React, { useState, useEffect } from "react";
import "./JobDescription.css";
import { Client } from "@gradio/client";
import JobAnalysisService from "./JobAnalysisService";

function JobDescription({ user, onJobDescriptionSubmit }) {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 1. DEFINE RED FLAGS (Must match your backend list)
  const SCAM_KEYWORDS = [
    'bitcoin', 'zelle', 'whatsapp', 'telegram', 
    'personal bank account', 'relabel', 'check', 
    'money order', 'package inspection', 'cash app',
    'kindly', 'trusted representative', 'valid bank account','training kit', 'worth ₹', 'starting salary of ₹', 
  'personal gmail address', 'confirmation within 24 hours',
  'pay for training', 'registration fee'
  ];

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
      // 2. CALL THE AI
      const client = await Client.connect("https://ankitdand-sentinelxai.hf.space/");
      const response = await client.predict("/analyze_text", {
        text: jobDescription,
      });

      console.log("Original AI Response:", response.data);

      // 3. SAFETY NET INTERCEPTION
      let confidenceData = response.data[0];
      const lowerDesc = jobDescription.toLowerCase();
      
      // Check for keywords
      const foundRedFlags = SCAM_KEYWORDS.filter(kw => lowerDesc.includes(kw));

      if (foundRedFlags.length > 0) {
        console.log("🚨 Safety Net Triggered! Found:", foundRedFlags);
        
        // FORCE THE RESULT TO BE FAKE
        // We override the AI's "95% Real" with "99% Fake"
        confidenceData = {
          label: "Fake",
          confidences: [
            { label: "Fake", confidence: 0.99 },
            { label: "Real", confidence: 0.01 }
          ]
        };
      }

      // 4. SAVE THE (POTENTIALLY MODIFIED) RESULT
      const analysisResult = JobAnalysisService.add(
        {
          confidence: confidenceData, 
          shapExplanation: response.data[1],
          jobDescription: jobDescription,
        },
        user.email,
      );

      setResult(analysisResult);

      if (onJobDescriptionSubmit) {
        onJobDescriptionSubmit(analysisResult);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to analyze job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="job-description-container">
      <div className="job-description-content">
        <div className="header-section">
          <h1>Analyze Job Description</h1>
          <p className="page-subtitle">Check jobs for authenticity instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="jd-form">
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description..."
            rows="12"
            className="jd-textarea"
            disabled={isLoading}
          />
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "🔍 Analyze Job Description"}
          </button>
        </form>

        {result && (
          <div className="results-section">
            
            {/* 5. ADD THE RED WARNING BANNER */}
            

            <div className="result-card confidence-card">
              <h3>Confidence Score</h3>
              <div className="confidence-display">
                {/* Standard Confidence Bar Rendering */}
                <div className={`confidence-label ${result.confidence.label.toLowerCase()}`}>
                  {result.confidence.label}
                </div>
                {/* ... (Keep your existing bar chart code here) ... */}
                 {result.confidence.confidences && result.confidence.confidences.map((conf, idx) => (
                    <div key={idx} className="confidence-item">
                      <span className="conf-label">{conf.label}:</span>
                      <div className="conf-bar-container">
                        <div className={`conf-bar ${conf.label.toLowerCase()}`} style={{width: `${conf.confidence * 100}%`}}></div>
                      </div>
                      <span className="conf-value">{(conf.confidence * 100).toFixed(1)}%</span>
                    </div>
                 ))}
              </div>
            </div>

            <div className="result-card explanation-card">
              <h3>SHAP Explanation</h3>
              <div className="shap-content" dangerouslySetInnerHTML={{ __html: result.shapExplanation }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDescription;