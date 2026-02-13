import React, { useEffect, useState } from "react";
import "./Results.css";
import JobAnalysisService from "./JobAnalysisService";

function Results({ user, jobDescriptionData }) {
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const loadAnalyses = () => {
    if (user?.email) {
      const allAnalyses = JobAnalysisService.getAll(user.email);
      const statistics = JobAnalysisService.getStats(user.email);
      setAnalyses(allAnalyses);
      setStats(statistics);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, [jobDescriptionData, user]); // Reload if data changes or user changes

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this analysis?")) {
      JobAnalysisService.delete(id);
      loadAnalyses();
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all analyses?")) {
      JobAnalysisService.clearAll(user?.email);
      loadAnalyses();
    }
  };

  const handleCardClick = (analysis) => {
    setSelectedAnalysis(analysis);
  };

  const handleCloseModal = () => {
    setSelectedAnalysis(null);
  };

  if (analyses.length === 0) {
    return (
      <div className="results-container">
        <div className="results-content">
          <div className="no-data">
            <span className="no-data-icon">📊</span>
            <h2>No Analyses Available</h2>
            <p>Please analyze a job description first to see results here.</p>
          </div>
        </div>
      </div>
    );
  }

  // ... (Rest of the JSX remains the same)
  return (
    <div className="results-container">
      <div className="results-content">
        <div className="results-header">
          <div>
            <h1>All Analyses</h1>
            <p className="page-subtitle">
              Total: {stats?.total} | Fake: {stats?.fake} (
              {stats?.fakePercentage}%) | Real: {stats?.real} (
              {stats?.realPercentage}%)
            </p>
          </div>
          <button onClick={handleClearAll} className="clear-all-button">
            Clear All
          </button>
        </div>

        <div className="analyses-grid">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="analysis-card"
              onClick={() => handleCardClick(analysis)}>
              <div className="analysis-card-header">
                <div className="analysis-time">
                  <span className="time-icon">🕐</span>
                  {analysis.timestamp}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(analysis.id);
                  }}
                  className="delete-button"
                  title="Delete this analysis">
                  ✕
                </button>
              </div>

              <div className="analysis-confidence">
                {analysis.confidence &&
                typeof analysis.confidence === "object" ? (
                  <>
                    <div
                      className={`confidence-badge ${analysis.confidence.label?.toLowerCase()}`}>
                      {analysis.confidence.label || "N/A"}
                    </div>
                    {analysis.confidence.confidences &&
                      Array.isArray(analysis.confidence.confidences) && (
                        <div className="mini-confidence-breakdown">
                          {analysis.confidence.confidences.map((conf, idx) => (
                            <div key={idx} className="mini-conf-item">
                              <span className="mini-conf-label">
                                {conf.label}:
                              </span>
                              <span className="mini-conf-value">
                                {(conf.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                ) : (
                  <div className="confidence-badge">{analysis.confidence}</div>
                )}
              </div>

              <div className="analysis-jd-preview">
                <h4>Job Description:</h4>
                <p>{analysis.jobDescription.substring(0, 200)}...</p>
              </div>

              <div className="analysis-shap-preview">
                <h4>SHAP Explanation Preview:</h4>
                <div
                  className="shap-mini"
                  dangerouslySetInnerHTML={{ __html: analysis.shapExplanation }}
                />
              </div>

              <div className="card-footer">
                <span className="view-details-hint">
                  Click to view details →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Modal View */}
        {selectedAnalysis && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Analysis Details</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-section">
                  <div className="modal-meta">
                    <div className="meta-item">
                      <span className="meta-label">📅 Analyzed On:</span>
                      <span className="meta-value">
                        {selectedAnalysis.timestamp}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">🆔 Analysis ID:</span>
                      <span className="meta-value">{selectedAnalysis.id}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>Prediction Result</h3>
                  {selectedAnalysis.confidence &&
                  typeof selectedAnalysis.confidence === "object" ? (
                    <div className="detailed-confidence">
                      <div
                        className={`confidence-badge-large ${selectedAnalysis.confidence.label?.toLowerCase()}`}>
                        {selectedAnalysis.confidence.label || "N/A"}
                      </div>
                      {selectedAnalysis.confidence.confidences &&
                        Array.isArray(
                          selectedAnalysis.confidence.confidences,
                        ) && (
                          <div className="confidence-breakdown-detailed">
                            {selectedAnalysis.confidence.confidences.map(
                              (conf, idx) => (
                                <div key={idx} className="conf-item-detailed">
                                  <div className="conf-header-detailed">
                                    <span className="conf-label-detailed">
                                      {conf.label}
                                    </span>
                                    <span className="conf-percentage-detailed">
                                      {(conf.confidence * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="conf-bar-container">
                                    <div
                                      className={`conf-bar ${conf.label.toLowerCase()}`}
                                      style={{
                                        width: `${conf.confidence * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="confidence-badge-large">
                      {selectedAnalysis.confidence}
                    </div>
                  )}
                </div>

                <div className="modal-section">
                  <h3>Job Description</h3>
                  <div className="job-description-full">
                    {selectedAnalysis.jobDescription}
                  </div>
                </div>

                <div className="modal-section">
                  <h3>SHAP Explanation</h3>
                  <div className="shap-explanation-full">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedAnalysis.shapExplanation,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="delete-button-modal"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this analysis?",
                      )
                    ) {
                      handleDelete(selectedAnalysis.id);
                      handleCloseModal();
                    }
                  }}>
                  🗑️ Delete Analysis
                </button>
                <button
                  className="close-button-modal"
                  onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;
