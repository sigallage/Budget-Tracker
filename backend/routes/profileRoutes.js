const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { checkJwt, getUserFromToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const multer = require('multer');

// Ensure uploads directory exists
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: avatarsDir,
  filename: (req, file, cb) => {
    const userId = req.user.dbUser._id;
    const ext = path.extname(file.originalname);
    const filename = `avatar-${userId}${ext}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to construct avatar URL
const getAvatarUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/avatars/${filename}`;
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
router.get('/', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.dbUser._id)
      .select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Construct avatar URL if picture exists
    let pictureUrl = user.picture;
    if (user.picture && !user.picture.startsWith('http')) {
      pictureUrl = getAvatarUrl(req, path.basename(user.picture));
    }

    res.json({
      ...user.toObject(),
      picture: pictureUrl
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
router.put(
  '/', 
  checkJwt, 
  getUserFromToken, 
  upload.single('avatar'), 
  async (req, res) => {
    try {
      const { name, phone, currencyPreference, notificationPreferences } = req.body;
      
      // Prepare update data
      const updateData = {
        name: name || '',
        phone: phone || '',
        currencyPreference: currencyPreference || 'USD'
      };

      // Parse notification preferences if it's a string
      if (notificationPreferences) {
        try {
          updateData.notificationPreferences = typeof notificationPreferences === 'string' 
            ? JSON.parse(notificationPreferences) 
            : notificationPreferences;
        } catch (e) {
          console.error('Error parsing notification preferences:', e);
          updateData.notificationPreferences = { email: true, push: true };
        }
      }

      // Handle avatar upload
      if (req.file) {
        // Delete old avatar if exists
        const user = await User.findById(req.user.dbUser._id);
        if (user.picture && !user.picture.startsWith('http')) {
          const oldAvatarPath = path.join(avatarsDir, path.basename(user.picture));
          if (fs.existsSync(oldAvatarPath)) {
            try {
              fs.unlinkSync(oldAvatarPath);
            } catch (e) {
              console.error('Error deleting old avatar:', e);
            }
          }
        }
        
        updateData.picture = req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.dbUser._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      // Construct picture URL
      let pictureUrl = updatedUser.picture;
      if (updatedUser.picture && !updatedUser.picture.startsWith('http')) {
        pictureUrl = getAvatarUrl(req, updatedUser.picture);
      }

      res.json({
        ...updatedUser.toObject(),
        picture: pictureUrl,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ error: 'Validation error', details: errors });
      }
      
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;