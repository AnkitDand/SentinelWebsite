import React from 'react';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Dashboard</h1>
            <p>Welcome to your account</p>
          </div>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
        
        <div className="dashboard-content">
          <div className="welcome-section">
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2>Welcome back, {user?.name}!</h2>
            <p>You have successfully logged in to your account.</p>
          </div>
          
          <div className="user-info-grid">
            <div className="info-card">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <span className="info-label">Full Name</span>
                <span className="info-value">{user?.name}</span>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">✉️</div>
              <div className="info-content">
                <span className="info-label">Email Address</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">🔐</div>
              <div className="info-content">
                <span className="info-label">Account Status</span>
                <span className="info-value status-active">Active</span>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <span className="info-label">Login Time</span>
                <span className="info-value">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-button">
                <span className="action-icon">⚙️</span>
                <span>Settings</span>
              </button>
              <button className="action-button">
                <span className="action-icon">👤</span>
                <span>Profile</span>
              </button>
              <button className="action-button">
                <span className="action-icon">🔔</span>
                <span>Notifications</span>
              </button>
              <button className="action-button">
                <span className="action-icon">❓</span>
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;