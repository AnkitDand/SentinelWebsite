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
  }, [jobDescriptionData, user]);

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

  const handleCardClick = (analysis) => setSelectedAnalysis(analysis);
  const handleCloseModal = () => setSelectedAnalysis(null);

  // ── CV score helpers ──────────────────────────────────────────────────────
  const getCvScoreColor = (score) => {
    if (score >= 50) return "#16a34a";
    if (score >= 20) return "#d97706";
    return "#dc2626";
  };

  const getCvScoreLabel = (score) => {
    if(score>=70) return "Strong Match";
    if (score >= 50) return "Match";
    if (score >= 20) return "Partial Match";
    return "Weak Match";
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

  return (
    <div className="results-container">
      <div className="results-content">

        {/* ── Header ───────────────────────────────────────────────────── */}
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

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <div className="analyses-grid">
          {analyses.map((analysis) => {
            const isReal =
              analysis.confidence?.label?.toLowerCase() === "real";
            const hasCvScore =
              isReal &&
              analysis.cvMatchScore !== null &&
              analysis.cvMatchScore !== undefined;

            return (
              <div
                key={analysis.id}
                className="analysis-card"
                onClick={() => handleCardClick(analysis)}
              >
                {/* Timestamp + Delete */}
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
                    title="Delete this analysis"
                  >
                    ✕
                  </button>
                </div>

                {/* Confidence Badge */}
                <div className="analysis-confidence">
                  {analysis.confidence &&
                  typeof analysis.confidence === "object" ? (
                    <>
                      <div
                        className={`confidence-badge ${analysis.confidence.label?.toLowerCase()}`}
                      >
                        {analysis.confidence.label || "N/A"}
                      </div>
                      {analysis.confidence.confidences &&
                        Array.isArray(analysis.confidence.confidences) && (
                          <div className="mini-confidence-breakdown">
                            {analysis.confidence.confidences.map(
                              (conf, idx) => (
                                <div key={idx} className="mini-conf-item">
                                  <span className="mini-conf-label">
                                    {conf.label}:
                                  </span>
                                  <span className="mini-conf-value">
                                    {(conf.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="confidence-badge">
                      {analysis.confidence}
                    </div>
                  )}
                </div>

                {/* CV Match Score (inline mini badge — real jobs only) */}
                {hasCvScore && (
                  <div className="cv-match-inline">
                    <span className="cv-inline-label">CV Match:</span>
                    <span
                      className="cv-inline-score"
                      style={{ color: getCvScoreColor(analysis.cvMatchScore) }}
                    >
                      {analysis.cvMatchScore}%
                    </span>
                    <span
                      className="cv-inline-tag"
                      style={{
                        background:
                          analysis.cvMatchScore >= 70
                            ? "#dcfce7"
                            : analysis.cvMatchScore >= 40
                            ? "#fef3c7"
                            : "#fee2e2",
                        color: getCvScoreColor(analysis.cvMatchScore),
                      }}
                    >
                      {getCvScoreLabel(analysis.cvMatchScore)}
                    </span>
                    {analysis.resumeFileName && (
                      <span className="cv-inline-file">
                        📋 {analysis.resumeFileName}
                      </span>
                    )}
                  </div>
                )}

                {/* Job Description Preview */}
                <div className="analysis-jd-preview">
                  <h4>Job Description:</h4>
                  <p>{analysis.jobDescription.substring(0, 200)}…</p>
                </div>

                {/* SHAP Preview */}
                <div className="analysis-shap-preview">
                  <h4>SHAP Explanation Preview:</h4>
                  <div
                    className="shap-mini"
                    dangerouslySetInnerHTML={{
                      __html: analysis.shapExplanation,
                    }}
                  />
                </div>

                <div className="card-footer">
                  <span className="view-details-hint">
                    Click to view details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detailed Modal ────────────────────────────────────────────── */}
        {selectedAnalysis && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Analysis Details</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body">

                {/* Meta */}
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
                    {selectedAnalysis.resumeFileName && (
                      <div className="meta-item">
                        <span className="meta-label">📋 Resume Used:</span>
                        <span className="meta-value">
                          {selectedAnalysis.resumeFileName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prediction Result */}
                <div className="modal-section">
                  <h3>🎯 Prediction Result</h3>
                  {selectedAnalysis.confidence &&
                  typeof selectedAnalysis.confidence === "object" ? (
                    <div className="detailed-confidence">
                      <div
                        className={`confidence-badge-large ${selectedAnalysis.confidence.label?.toLowerCase()}`}
                      >
                        {selectedAnalysis.confidence.label || "N/A"}
                      </div>
                      {selectedAnalysis.confidence.confidences &&
                        Array.isArray(
                          selectedAnalysis.confidence.confidences
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
                              )
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

                {/* CV Match Score (Modal) — real jobs with a score only */}
                {selectedAnalysis.confidence?.label?.toLowerCase() === "real" &&
                  selectedAnalysis.cvMatchScore !== null &&
                  selectedAnalysis.cvMatchScore !== undefined && (
                    <div className="modal-section">
                      <h3>📄 CV Match Score</h3>
                      <div className="modal-cv-match">
                        <div className="modal-cv-ring-wrap">
                          <svg viewBox="0 0 120 120" className="modal-cv-ring-svg">
                            <circle
                              cx="60" cy="60" r="50"
                              fill="none" stroke="#e5e7eb" strokeWidth="10"
                            />
                            <circle
                              cx="60" cy="60" r="50"
                              fill="none"
                              stroke={getCvScoreColor(
                                selectedAnalysis.cvMatchScore
                              )}
                              strokeWidth="10"
                              strokeDasharray={`${(selectedAnalysis.cvMatchScore / 100) * 314} 314`}
                              strokeLinecap="round"
                              transform="rotate(-90 60 60)"
                            />
                          </svg>
                          <div className="modal-cv-ring-inner">
                            <span
                              className="modal-cv-ring-score"
                              style={{
                                color: getCvScoreColor(
                                  selectedAnalysis.cvMatchScore
                                ),
                              }}
                            >
                              {selectedAnalysis.cvMatchScore}%
                            </span>
                            <span className="modal-cv-ring-label">
                              {getCvScoreLabel(selectedAnalysis.cvMatchScore)}
                            </span>
                          </div>
                        </div>
                        <div className="modal-cv-info">
                          <p>
                            Keyword overlap between your uploaded resume and
                            this job description.
                          </p>
                          {selectedAnalysis.resumeFileName && (
                            <p>
                              <strong>Resume:</strong>{" "}
                              {selectedAnalysis.resumeFileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Job Description Full */}
                <div className="modal-section">
                  <h3>📝 Job Description</h3>
                  <div className="job-description-full">
                    {selectedAnalysis.jobDescription}
                  </div>
                </div>

                {/* SHAP Explanation Full */}
                <div className="modal-section">
                  <h3>🧠 SHAP Explanation</h3>
                  <div className="shap-explanation-full">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedAnalysis.shapExplanation,
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  className="delete-button-modal"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this analysis?"
                      )
                    ) {
                      handleDelete(selectedAnalysis.id);
                      handleCloseModal();
                    }
                  }}
                >
                  🗑️ Delete Analysis
                </button>
                <button
                  className="close-button-modal"
                  onClick={handleCloseModal}
                >
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