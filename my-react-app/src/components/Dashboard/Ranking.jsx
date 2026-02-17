import React, { useState, useEffect } from "react";
import "./Ranking.css";
import JobAnalysisService from "./JobAnalysisService";

const Ranking = ({ user }) => {
  const [rankedJobs, setRankedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const localAnalyses = JobAnalysisService.getAll(user.email);

        if (localAnalyses.length === 0) {
          setRankedJobs([]);
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/rank_jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ analyses: localAnalyses }),
        });

        if (response.ok) {
          const data = await response.json();
          setRankedJobs(data);
        }
      } catch (err) {
        console.error("Ranking fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [user]);

  // ── CV score helpers ──────────────────────────────────────────────────────
  const getCvScoreColor = (score) => {
    if (score >= 50) return "#16a34a";
    if (score >= 20) return "#d97706";
    return "#dc2626";
  };

  const getCvScoreLabel = (score) => {
    if (score >= 70) return "Strong Match";
    if (score >= 50) return "Match";
    if (score >= 20) return "Partial Match";
    
    return "Weak";
  };

  if (loading)
    return <div className="loading">Processing Smart Rankings…</div>;

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h1>Smart Job Rankings</h1>
        <p>
          Ranked by <strong>Authenticity</strong>,{" "}
          <strong>Relevance</strong> &amp; <strong>CV Match</strong> for{" "}
          <span className="profession-highlight">
            {user?.profession || "Student"}
          </span>
        </p>
      </div>

      <div className="ranking-list">
        {rankedJobs.length === 0 ? (
          <div className="empty-state">
            No jobs analyzed yet. Go to Analyze to get started.
          </div>
        ) : (
          rankedJobs.map((job, index) => (
            <div
              key={index}
              className={`ranking-card
                ${job.risk_level === "HIGH" ? "card-fake" : ""}
                ${job.is_relevant ? "card-relevant" : "card-irrelevant"}
              `}
            >
              {/* Rank Number Side Box — turns RED for fake jobs */}
              <div className="rank-number">#{index + 1}</div>

              <div className="card-content">
                <div className="card-top-row">

                  {/* Authenticity Score */}
                  <div className="score-badge">
                    <span className="score-label">Real Score</span>
                    <span
                      className={`score-val ${
                        job.base_real_score < 60 ? "score-low" : ""
                      }`}
                    >
                      {job.base_real_score}%
                    </span>
                  </div>

                  {/* CV Match Score — only shown for safe (real) jobs with a resume */}
                  {job.is_safe &&
                    job.cvMatchScore !== null &&
                    job.cvMatchScore !== undefined && (
                      <div className="cv-match-badge">
                        <span className="score-label">CV Match</span>
                        <div className="cv-mini-ring-wrap">
                          <svg viewBox="0 0 56 56" className="cv-mini-ring">
                            <circle
                              cx="28" cy="28" r="22"
                              fill="none" stroke="#e5e7eb" strokeWidth="5"
                            />
                            <circle
                              cx="28" cy="28" r="22"
                              fill="none"
                              stroke={getCvScoreColor(job.cvMatchScore)}
                              strokeWidth="5"
                              strokeDasharray={`${(job.cvMatchScore / 100) * 138} 138`}
                              strokeLinecap="round"
                              transform="rotate(-90 28 28)"
                            />
                          </svg>
                          <span
                            className="cv-mini-score"
                            style={{ color: getCvScoreColor(job.cvMatchScore) }}
                          >
                            {job.cvMatchScore}%
                          </span>
                        </div>
                        <span
                          className="cv-mini-label"
                          style={{ color: getCvScoreColor(job.cvMatchScore) }}
                        >
                          {getCvScoreLabel(job.cvMatchScore)}
                        </span>
                      </div>
                    )}

                  {/* Status Badges */}
                  <div className="badges-container">
                    {job.risk_level === "HIGH" && (
                      <div className="status-badge status-fake-alert">
                        🚨 Not safe to apply
                      </div>
                    )}
                    <div
                      className={`status-badge ${
                        job.is_relevant ? "status-match" : "status-mismatch"
                      }`}
                    >
                      {job.is_relevant ? "✓ Match" : "⚠ Mismatch"}
                    </div>
                  </div>
                </div>

                {/* Nudge for real jobs with no CV attached */}
                {job.is_safe &&
                  (job.cvMatchScore === null ||
                    job.cvMatchScore === undefined) && (
                    <div className="cv-no-resume-hint">
                      💡 Upload your resume on the Analyze page to see CV match
                      score for this job
                    </div>
                  )}

                {/* Job Description Snippet */}
                <div className="job-description-box">
                  <h4>Job Context:</h4>
                  <p>{job.jobDescription.substring(0, 180)}…</p>
                </div>

                {/* Smart Alert */}
                {job.relevance_alert && (
                  <div
                    className={`smart-alert ${
                      job.risk_level === "HIGH"
                        ? "alert-danger"
                        : "alert-warning"
                    }`}
                  >
                    {job.risk_level === "HIGH" ? "⛔ " : "⚠️ "}
                    {job.relevance_alert}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Ranking;