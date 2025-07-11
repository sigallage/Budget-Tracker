import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './Header.css';

const Header = () => {
  const { 
    loginWithRedirect, 
    logout, 
    isAuthenticated, 
    user, 
    isLoading 
  } = useAuth0();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    });
  };

  const handleSignUp = () => {
    loginWithRedirect({
      screen_hint: 'signup',
      appState: { returnTo: window.location.pathname }
    });
  };

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking on a link
  useEffect(() => {
    if (isMobileMenuOpen) {
      const handleRouteChange = () => setIsMobileMenuOpen(false);
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, [isMobileMenuOpen]);

  if (isLoading) {
    return null; // Or return a loading spinner
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <span className="logo">BudgetTracker</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/groups">Groups</Link></li>
            <li><Link to="/expenses">Expenses</Link></li>
            <li><Link to="/reports">Reports</Link></li>
          </ul>
        </nav>

        {/* Auth Buttons - Desktop */}
        <div className="auth-buttons">
          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="avatar-button"
                onClick={() => navigate('/profile')}
              >
                <img 
                  src={user?.picture || '/default-avatar.png'} 
                  alt="User Avatar" 
                  className="user-avatar"
                />
              </button>
              <div className="dropdown-menu">
                <Link to="/profile">Profile</Link>
                <button onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          ) : (
            <>
              <button className="login-button" onClick={handleLogin}>
                Log In
              </button>
              <button className="signup-button" onClick={handleSignUp}>
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav>
          <ul className="mobile-nav-links">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/groups">Groups</Link></li>
            <li><Link to="/expenses">Expenses</Link></li>
            <li><Link to="/reports">Reports</Link></li>
          </ul>

          <div className="mobile-auth-buttons">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  className="mobile-profile-link"
                  onClick={toggleMobileMenu}
                >
                  <img 
                    src={user?.picture || '/default-avatar.png'} 
                    alt="User Avatar" 
                    className="mobile-user-avatar"
                  />
                  <span>Profile</span>
                </Link>
                <button 
                  className="mobile-logout-button"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button 
                  className="mobile-login-button"
                  onClick={handleLogin}
                >
                  Log In
                </button>
                <button 
                  className="mobile-signup-button"
                  onClick={handleSignUp}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;