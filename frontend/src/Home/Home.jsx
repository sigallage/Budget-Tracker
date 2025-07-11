import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-badge">
          ✨ Smart Expense Management
        </div>
        
        <h1>Track Shared Expenses Easily</h1>
        
        <p className="subtitle">
          BudgetTracker helps you manage expenses with family, friends, or roommates. 
          Keep track of who owes what and settle up quickly with our intelligent tracking system.
        </p>

        <div className="home-actions">
          {!isAuthenticated ? (
            <>
              <Link to="/signup" className="cta-button cta-primary">
                Get Started Free
              </Link>
              <Link to="/login" className="cta-button cta-secondary">
                Log In
              </Link>
            </>
          ) : (
            <>
              <Link to="/groups" className="cta-button cta-primary">
                Go to Groups
              </Link>
              <Link to="/calendar" className="cta-button cta-secondary">
                View Calendar
              </Link>
            </>
          )}
        </div>
        
        <div className="scroll-indicator"></div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="features-header">
          <h2 className="features-title">Why Choose BudgetTracker?</h2>
          <p className="features-subtitle">
            Simplify your shared expenses with powerful features designed for modern life
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>Smart Expense Tracking</h3>
            <p>Easily add and categorize shared expenses with friends and family. Our smart categorization helps you understand your spending patterns.</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Group Management</h3>
            <p>Create groups for different occasions like trips, roommates, or dinners. Manage multiple expense groups effortlessly.</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Detailed Reports</h3>
            <p>Get detailed insights into your spending patterns and group expenses with beautiful charts and analytics.</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Quick Settlement</h3>
            <p>Calculate who owes what instantly. Split bills fairly and settle debts with just a few clicks.</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Secure & Private</h3>
            <p>Your financial data is encrypted and secure. We prioritize your privacy and data protection.</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Mobile Friendly</h3>
            <p>Access your expenses anywhere, anytime. Our responsive design works perfectly on all devices.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;