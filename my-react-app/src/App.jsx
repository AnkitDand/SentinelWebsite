import React, { useState, useEffect } from 'react';
import Login from './components/Login/Login.jsx';
import Signup from './components/Signup/Signup.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'signup'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLoginSuccess = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleSignupSuccess = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setView('login');
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : view === 'login' ? (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onSwitchToSignup={() => setView('signup')}
        />
      ) : (
        <Signup 
          onSignupSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setView('login')}
        />
      )}
    </div>
  );
}

export default App;