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
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [user]);

  if (loading)
    return <div className="loading">Processing Smart Rankings...</div>;

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h1>🏆 Smart Job Rankings</h1>
        <p>
          Ranked by <strong>Authenticity</strong> & <strong>Relevance</strong>{" "}
          to{" "}
          <span className="profession-highlight">
            {user?.profession || "Student"}
          </span>
        </p>
      </div>

      <div className="ranking-list">
        {rankedJobs.length === 0 ? (
          <div className="empty-state">No jobs analyzed yet.</div>
        ) : (
          rankedJobs.map((job, index) => (
            <div
              key={index}
              className={`ranking-card 
                ${job.risk_level === "HIGH" ? "card-fake" : ""}
                ${job.is_relevant ? "card-relevant" : "card-irrelevant"}
              `}>
              {/* Rank Number (Side Box) - Will turn RED if card-fake is present */}
              <div className="rank-number">#{index + 1}</div>

              <div className="card-content">
                <div className="card-top-row">
                  {/* Score Badge */}
                  <div className="score-badge">
                    <span className="score-label">Real Score</span>
                    <span
                      className={`score-val ${job.base_real_score < 60 ? "score-low" : ""}`}>
                      {job.base_real_score}%
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div className="badges-container">
                    {/* DANGER: Fake Job Warning */}
                    {job.risk_level === "HIGH" && (
                      <div className="status-badge status-fake-alert">
                        🚨 Not safe for you to apply
                      </div>
                    )}

                    {/* Relevance Badge */}
                    <div
                      className={`status-badge ${job.is_relevant ? "status-match" : "status-mismatch"}`}>
                      {job.is_relevant ? "✓ Match" : "⚠ Mismatch"}
                    </div>
                  </div>
                </div>

                <div className="job-description-box">
                  <h4>Job Context:</h4>
                  <p>{job.jobDescription.substring(0, 180)}...</p>
                </div>

                {/* Text Alerts */}
                {job.relevance_alert && (
                  <div
                    className={`smart-alert ${job.risk_level === "HIGH" ? "alert-danger" : "alert-warning"}`}>
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
