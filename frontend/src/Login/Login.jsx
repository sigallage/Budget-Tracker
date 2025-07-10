import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Login.css';

const Login = ({ setCurrentUser }) => {
  const { user, getAccessTokenSilently, loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        // 1. Get Auth0 access token
        const accessToken = await getAccessTokenSilently();
        
        // 2. Send login request to your backend
        const response = await axios.post('/api/auth/login', {
          auth0Id: user.sub
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        // 3. Store user data in your frontend state
        setCurrentUser(response.data.user);
        
        // 4. Redirect to dashboard
        navigate('/dashboard');
        
      } catch (error) {
        console.error('Login failed:', error);
        // Handle errors (show message to user)
      }
    };
    
    if (isAuthenticated && user) {
      handleLogin();
    }
  }, [isAuthenticated, user, navigate, getAccessTokenSilently, setCurrentUser]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Log in to your BudgetTracker account</p>
        </div>
        
        <div className="auth-providers">
          <button 
            className="auth-button primary"
            onClick={() => loginWithRedirect()}
          >
            Continue with Email
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            className="auth-button google"
            onClick={() => loginWithRedirect({
              connection: 'google-oauth2'
            })}
          >
            Continue with Google
          </button>
          
          <button 
            className="auth-button facebook"
            onClick={() => loginWithRedirect({
              connection: 'facebook'
            })}
          >
            Continue with Facebook
          </button>
        </div>
        
        <p className="signup-redirect">
          Don't have an account?{' '}
          <button 
            className="signup-link" 
            onClick={() => loginWithRedirect({
              screen_hint: 'signup'
            })}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;