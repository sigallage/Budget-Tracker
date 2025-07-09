import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './SignUp.css';

const SignUp = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Create Your Account</h1>
        <p className="signup-subtitle">Join BudgetTracker to manage shared expenses with family and friends</p>
        
        <div className="auth-providers">
          <button 
            className="auth-button primary"
            onClick={() => loginWithRedirect({
              screen_hint: 'signup',
              appState: { returnTo: '/profile-setup' }
            })}
          >
            Sign Up with Email
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            className="auth-button google"
            onClick={() => loginWithRedirect({
              connection: 'google-oauth2',
              appState: { returnTo: '/profile-setup' }
            })}
          >
            Continue with Google
          </button>
          
          <button 
            className="auth-button facebook"
            onClick={() => loginWithRedirect({
              connection: 'facebook',
              appState: { returnTo: '/profile-setup' }
            })}
          >
            Continue with Facebook
          </button>
        </div>
        
        <p className="login-redirect">
          Already have an account?{' '}
          <button 
            className="login-link" 
            onClick={() => loginWithRedirect()}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;