const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth0 = require('../config/auth0');

// Handle Auth0 callback and create/update user in MongoDB
router.post('/callback', async (req, res) => {
  try {
    const { auth0Id, email, name, picture } = req.body;

    // Check if user exists in our DB
    let user = await User.findOne({ auth0Id });

    if (!user) {
      // Create new user
      user = new User({
        auth0Id,
        email,
        name,
        picture
      });
      await user.save();
      
      // Optionally update Auth0 user metadata
      await auth0.updateUserMetadata(
        { id: auth0Id }, 
        { app_metadata: { mongoUserId: user._id.toString() } }
      );
    } else {
      // Update existing user if needed
      user.email = email;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Auth0 login callback
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { auth0Id } = req.body;
    
    if (!auth0Id) {
      return res.status(400).json({ success: false, error: 'Auth0 ID is required' });
    }

    // Find user in database
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found. Please sign up first.' 
      });
    }

    // Return user data (excluding sensitive info)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      groups: user.groups
    };

    res.status(200).json({ 
      success: true, 
      user: userData 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// @desc    Get user session
// @route   GET /api/auth/session
// @access  Private
router.get('/session', authMiddleware.checkJwt, authMiddleware.getUserFromToken, async (req, res) => {
  try {
    const user = req.user.dbUser;
    
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      groups: user.groups
    };

    res.status(200).json({ 
      success: true, 
      user: userData 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Session validation failed' });
  }
});

module.exports = router;