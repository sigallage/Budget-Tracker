import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Track Shared Expenses Easily</h1>
        <p>
          BudgetTracker helps you manage expenses with family, friends, or roommates.
          Keep track of who owes what and settle up quickly.
        </p>
        <div className="home-actions">
          {!isAuthenticated ? (
            <>
              <Link to="/signup" className="primary-button">
                Get Started
              </Link>
              <Link to="/login" className="secondary-button">
                Log In
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className="primary-button">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
      <div className="home-features">
        <div className="feature-card">
          <span className="feature-icon">💰</span>
          <h3>Track Expenses</h3>
          <p>Easily add and categorize shared expenses with friends and family.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">👥</span>
          <h3>Manage Groups</h3>
          <p>Create groups for different occasions like trips, roommates, or dinners.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📊</span>
          <h3>View Reports</h3>
          <p>Get detailed insights into your spending patterns and group expenses.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;