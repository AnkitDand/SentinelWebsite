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
    // 1. Read from storage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    // 2. rigorous check: make sure data exists AND isn't the string "undefined"
    if (token && userData && userData !== "undefined") {
      try {
        // 3. Try to parse. If this fails, the catch block handles it.
        const parsedUser = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        // 4. If error (e.g. invalid JSON), clear storage to fix the crash loop
        console.error("Corrupt data found in localStorage. Clearing...", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      // 5. If data is missing or explicitly "undefined", ensure clean state
      if (userData === "undefined") {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = (token, userData) => {
    // Safety check: Don't save if userData is undefined
    if (!userData) {
      console.error("Attempted to save undefined user data");
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleSignupSuccess = (token, userData) => {
    // Safety check: Don't save if userData is undefined
    if (!userData) {
      console.error("Attempted to save undefined user data");
      return;
    }
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