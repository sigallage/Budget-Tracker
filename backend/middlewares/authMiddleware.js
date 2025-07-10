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

// Attach MongoDB user to request
const getUserFromToken = async (req, res, next) => {
  try {
    const auth0Id = req.user.sub;
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found in database' 
      });
    }
    
    req.user.dbUser = user;
    next();
  } catch (error) {
    console.error('User lookup error:', error);
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