import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const isActiveRoute = (path) => {
    if (path === '/groups') {
      return location.pathname === '/groups' || location.pathname.startsWith('/groups/');
    }
    if (path === '/calendar') {
      return location.pathname === '/calendar' || location.pathname.includes('/calendar');
    }
    if (path === '/charts') {
      return location.pathname === '/charts';
    }
    if (path === '/income') {
      return location.pathname === '/income';
    }
    return location.pathname === path;
  };

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return null;
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
        {isAuthenticated && (
          <nav className="desktop-nav">
            <Link 
              to="/groups" 
              className={`nav-link ${isActiveRoute('/groups') ? 'active' : ''}`}
            >
              Groups
            </Link>
            <Link 
              to="/charts" 
              className={`nav-link ${isActiveRoute('/charts') ? 'active' : ''}`}
            >
              Charts
            </Link>
            <Link 
              to="/income" 
              className={`nav-link ${isActiveRoute('/income') ? 'active' : ''}`}
            >
              Income
            </Link>
            <Link 
              to="/calendar" 
              className={`nav-link ${isActiveRoute('/calendar') ? 'active' : ''}`}
            >
              Calendar
            </Link>
          </nav>
        )}

        {/* Desktop Auth Buttons */}
        <div className="desktop-auth">
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
              <button className="logout-button" onClick={handleLogout}>
                Log Out
              </button>
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

        {/* Hamburger Menu Button */}
        <button 
          className="hamburger-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-content">
          <ul className="mobile-nav-links">
            {isAuthenticated ? (
              <>
                <li className="nav-section">
                  <span className="nav-section-title">Navigation</span>
                </li>
                <li><Link to="/groups" onClick={closeMobileMenu}>
                  <span className="nav-icon">👥</span>
                  Groups
                </Link></li>
                <li><Link to="/charts" onClick={closeMobileMenu}>
                  <span className="nav-icon">📊</span>
                  Charts
                </Link></li>
                <li><Link to="/income" onClick={closeMobileMenu}>
                  <span className="nav-icon">💰</span>
                  Income
                </Link></li>
                <li><Link to="/calendar" onClick={closeMobileMenu}>
                  <span className="nav-icon">📅</span>
                  Calendar
                </Link></li>
                
                <li className="nav-divider"></li>
                
                <li className="nav-section">
                  <span className="nav-section-title">Account</span>
                </li>
                <li><Link to="/profile" onClick={closeMobileMenu}>
                  <span className="nav-icon">👤</span>
                  Profile
                </Link></li>
                <li><button onClick={handleLogout} className="mobile-logout">
                  <span className="nav-icon">🚪</span>
                  Log Out
                </button></li>
              </>
            ) : (
              <>
                <li><Link to="/" onClick={closeMobileMenu}>
                  <span className="nav-icon">🏠</span>
                  Home
                </Link></li>
              </>
            )}
          </ul>
          
          {!isAuthenticated && (
            <div className="mobile-auth-section">
              <div className="mobile-auth-buttons">
                <button className="login-button" onClick={() => { handleLogin(); closeMobileMenu(); }}>
                  Log In
                </button>
                <button className="signup-button" onClick={() => { handleSignUp(); closeMobileMenu(); }}>
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;