import React, { useState, useEffect } from "react";
import "./Home.css";

function Home({ user }) {
  const [animatedStats, setAnimatedStats] = useState({
    jobsScanned: 0,
    scamsDetected: 0,
    usersProtected: 0,
    accuracyRate: 0,
    warningsIssued: 0,
    responseTime: 0,
  });

  // Animate numbers on mount
  useEffect(() => {
    const targetStats = {
      jobsScanned: 15847,
      scamsDetected: 3241,
      usersProtected: 8923,
      accuracyRate: 94.7,
      warningsIssued: 12456,
      responseTime: 40,
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        jobsScanned: Math.floor(targetStats.jobsScanned * progress),
        scamsDetected: Math.floor(targetStats.scamsDetected * progress),
        usersProtected: Math.floor(targetStats.usersProtected * progress),
        accuracyRate: (targetStats.accuracyRate * progress).toFixed(1),
        warningsIssued: Math.floor(targetStats.warningsIssued * progress),
        responseTime: (targetStats.responseTime * progress).toFixed(1),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(targetStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Fake data for detection trends
  const detectionData = [
    { month: "Jan", fake: 245, genuine: 1876 },
    { month: "Feb", fake: 312, genuine: 2103 },
    { month: "Mar", fake: 289, genuine: 1954 },
    { month: "Apr", fake: 401, genuine: 2234 },
    { month: "May", fake: 378, genuine: 2087 },
    { month: "Jun", fake: 456, genuine: 2456 },
  ];

  // Risk categories
  const riskCategories = [
    { category: "Salary Scams", percentage: 32, color: "#ef4444" },
    { category: "Fake Companies", percentage: 28, color: "#f59e0b" },
    { category: "Phishing Links", percentage: 24, color: "#eab308" },
    { category: "Data Theft", percentage: 16, color: "#6b7fed" },
  ];

  // User experience distribution
  const userExperience = [
    { level: "Freshers (0-1yr)", count: 3421, risk: "High" },
    { level: "Junior (1-3yr)", count: 2876, risk: "Medium" },
    { level: "Mid-level (3-5yr)", count: 1834, risk: "Low" },
    { level: "Senior (5+yr)", count: 792, risk: "Very Low" },
  ];

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Header Section */}
        <div className="header-section">
          <h1>Hello, {user?.name}!</h1>
          <p className="welcome-text">
            Welcome to SentinelXAI Dashboard - Protecting job seekers with
            AI-powered detection
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-1">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{animatedStats.jobsScanned.toLocaleString()}</h3>
              <p>Jobs Scanned</p>
            </div>
            <div className="stat-trend positive">↑ 12% this month</div>
          </div>

          <div className="stat-card stat-card-2">
            <div className="stat-icon">🛡️</div>
            <div className="stat-content">
              <h3>{animatedStats.scamsDetected.toLocaleString()}</h3>
              <p>Scams Detected</p>
            </div>
            <div className="stat-trend negative">↓ 8% vs last month</div>
          </div>

          <div className="stat-card stat-card-3">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{animatedStats.usersProtected.toLocaleString()}</h3>
              <p>Users Protected</p>
            </div>
            <div className="stat-trend positive">↑ 23% this month</div>
          </div>

          <div className="stat-card stat-card-4">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{animatedStats.accuracyRate}%</h3>
              <p>Accuracy Rate</p>
            </div>
            <div className="stat-trend positive">DistilBERT + SHAP</div>
          </div>

          <div className="stat-card stat-card-5">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{animatedStats.warningsIssued.toLocaleString()}</h3>
              <p>Warnings Issued</p>
            </div>
            <div className="stat-trend positive">↑ 15% this month</div>
          </div>

          <div className="stat-card stat-card-6">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>{animatedStats.responseTime}s</h3>
              <p>Avg Response Time</p>
            </div>
            <div className="stat-trend positive">Real-time Analysis</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Detection Trends Chart */}
          <div className="chart-card">
            <h2>Monthly Detection Trends</h2>
            <p className="chart-subtitle">Fake vs Genuine Job Postings</p>
            <div className="bar-chart">
              {detectionData.map((data, index) => {
                const total = data.fake + data.genuine;
                const fakePercentage = (data.fake / total) * 100;
                const genuinePercentage = (data.genuine / total) * 100;

                return (
                  <div key={index} className="bar-group">
                    <div className="bar-stack">
                      <div
                        className="bar-segment genuine"
                        style={{
                          height: `${genuinePercentage * 2}px`,
                          animationDelay: `${index * 0.1}s`,
                        }}
                        title={`Genuine: ${data.genuine}`}></div>
                      <div
                        className="bar-segment fake"
                        style={{
                          height: `${fakePercentage * 2}px`,
                          animationDelay: `${index * 0.1}s`,
                        }}
                        title={`Fake: ${data.fake}`}></div>
                    </div>
                    <span className="bar-label">{data.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color genuine"></span>
                <span>Genuine Jobs</span>
              </div>
              <div className="legend-item">
                <span className="legend-color fake"></span>
                <span>Fake Jobs</span>
              </div>
            </div>
          </div>

          {/* Risk Categories */}
          <div className="chart-card">
            <h2>Scam Categories</h2>
            <p className="chart-subtitle">Most Common Types Detected</p>
            <div className="risk-chart">
              {riskCategories.map((risk, index) => (
                <div key={index} className="risk-item">
                  <div className="risk-header">
                    <span className="risk-name">{risk.category}</span>
                    <span className="risk-percentage">{risk.percentage}%</span>
                  </div>
                  <div className="risk-bar-container">
                    <div
                      className="risk-bar"
                      style={{
                        width: `${risk.percentage}%`,
                        background: risk.color,
                        animationDelay: `${index * 0.15}s`,
                      }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Experience Table */}
        <div className="chart-card full-width">
          <h2>User Experience Distribution</h2>
          <p className="chart-subtitle">
            Personalized Protection Based on Experience Level
          </p>
          <div className="experience-table">
            {userExperience.map((exp, index) => (
              <div
                key={index}
                className="experience-row"
                style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="exp-level">
                  <span className="exp-icon">👤</span>
                  <span className="exp-text">{exp.level}</span>
                </div>
                <div className="exp-count">
                  <span className="count-number">
                    {exp.count.toLocaleString()}
                  </span>
                  <span className="count-label">users</span>
                </div>
                <div className="exp-risk">
                  <span
                    className={`risk-badge ${exp.risk.toLowerCase().replace(" ", "-")}`}>
                    {exp.risk} Risk
                  </span>
                </div>
                <div className="exp-bar">
                  <div
                    className="exp-bar-fill"
                    style={{
                      width: `${(exp.count / 3421) * 100}%`,
                      animationDelay: `${index * 0.1}s`,
                    }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Model Info */}
        <div className="charts-row">
          <div className="chart-card">
            <h2>AI Technology Stack</h2>
            <div className="tech-stack">
              <div className="tech-item">
                <div className="tech-icon">🤖</div>
                <h3>DistilBERT</h3>
                <p>Transformer model for text classification</p>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🔍</div>
                <h3>SHAP & LIME</h3>
                <p>Explainable AI for transparency</p>
              </div>
              <div className="tech-item">
                <div className="tech-icon">⚡</div>
                <h3>Real-time Detection</h3>
                <p>Instant analysis and warnings</p>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h2>System Features</h2>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <div>
                  <h4>Explainable Decisions</h4>
                  <p>Clear reasoning for every detection</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👤</span>
                <div>
                  <h4>Personalized Warnings</h4>
                  <p>Tailored alerts based on experience</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <div>
                  <h4>User Education</h4>
                  <p>Learn to identify scams independently</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <h4>High Accuracy</h4>
                  <p>94.7% detection accuracy rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
