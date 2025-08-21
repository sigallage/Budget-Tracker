const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const User = require('../models/User');

// Validate JWT from Auth0
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// Attach MongoDB user to request (create if doesn't exist)
const getUserFromToken = async (req, res, next) => {
  try {
    const auth0Id = req.user.sub;
    console.log('Processing user with Auth0 ID:', auth0Id);
    
    // Try to find existing user in database
    let user = await User.findOne({ auth0Id });
    
    if (!user) {
      console.log('User not found in database, creating new user...');
      
      // Get user profile from Auth0 userinfo endpoint
      const token = req.headers.authorization?.split(' ')[1];
      let userProfile = {};
      
      try {
        const userInfoUrl = `${process.env.AUTH0_DOMAIN}/userinfo`;
        console.log('Fetching user info from:', userInfoUrl);
        
        const response = await fetch(userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          userProfile = await response.json();
          console.log('Auth0 userinfo response:', userProfile);
        } else {
          console.log('Could not fetch user profile from Auth0:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('Error fetching user profile from Auth0:', error.message);
      }
      
      // Create user data with fallbacks
      const userData = {
        auth0Id,
        email: userProfile.email || `user_${auth0Id.replace(/[|@]/g, '_')}@placeholder.com`,
        name: userProfile.name || userProfile.nickname || 'User',
        picture: userProfile.picture || '',
        currencyPreference: 'USD',
        notificationPreferences: {
          email: true,
          push: true
        }
      };
      
      console.log('Creating user with data:', userData);
      
      user = new User(userData);
      await user.save();
      console.log('New user created successfully with ID:', user._id);
    } else {
      console.log('Found existing user:', user._id);
    }
    
    req.user.dbUser = user;
    next();
  } catch (error) {
    console.error('User lookup/creation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to authenticate user' 
    });
  }
};

// Role-based access control
const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user[process.env.AUTH0_NAMESPACE + 'roles']?.includes(role)) {
      return next();
    }
    return res.status(403).json({ 
      success: false,
      error: 'Insufficient permissions' 
    });
  };
};

module.exports = { 
  checkJwt, 
  getUserFromToken,
  checkRole 
};