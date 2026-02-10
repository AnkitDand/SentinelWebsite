import React, { useState } from 'react';
import './Dashboard.css';
import Home from './Home';
import JobDescription from './JobDescription';
import Results from './Results';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <Home user={user} />;
      case 'job-description':
        return <JobDescription />;
      case 'results':
        return <Results />;
      default:
        return <Home user={user} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Dashboard</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'job-description' ? 'active' : ''}`}
            onClick={() => setActiveTab('job-description')}
          >
            <span className="nav-icon">📝</span>
            <span>Job Description</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <span className="nav-icon">📊</span>
            <span>Results</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button onClick={onLogout} className="logout-button">
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;