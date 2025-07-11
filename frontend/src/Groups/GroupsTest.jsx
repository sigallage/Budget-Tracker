import React from 'react';
import { Link } from 'react-router-dom';
import './Groups.css';

const GroupsTest = () => {
  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Your Groups</h1>
        <div className="groups-actions">
          <button className="btn-primary">
            Create Group
          </button>
          <button className="btn-secondary">
            Join Group
          </button>
        </div>
      </div>

      <div className="empty-state">
        <div className="empty-icon">👥</div>
        <h2>Groups Page is Working!</h2>
        <p>This page is rendering correctly. The issue was API calls to backend.</p>
        <p>Navigation is working properly.</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default GroupsTest;
