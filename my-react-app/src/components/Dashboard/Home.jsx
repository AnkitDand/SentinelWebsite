import React from "react";
import "./Home.css";

function Home({ user }) {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Hello, {user?.name}!</h1>
        <p className="welcome-text">Welcome to your dashboard</p>
      </div>
    </div>
  );
}

export default Home;
