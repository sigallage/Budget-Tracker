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
      .select('-__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const avatarUrl = user.avatar ? getAvatarUrl(req, path.basename(user.avatar)) : null;

    res.json({
      ...user.toObject(),
      picture: avatarUrl
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
      const updateData = {
        name,
        phone: phone || null,
        currencyPreference,
        notificationPreferences: JSON.parse(notificationPreferences)
      };

      // Handle avatar upload
      if (req.file) {
        // Delete old avatar if exists
        const user = await User.findById(req.user.dbUser._id);
        if (user.avatar) {
          const oldAvatarPath = path.join(avatarsDir, path.basename(user.avatar));
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        
        updateData.avatar = req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.dbUser._id,
        updateData,
        { new: true }
      ).select('-__v -createdAt -updatedAt');

      const avatarUrl = updatedUser.avatar ? getAvatarUrl(req, updatedUser.avatar) : null;

      res.json({
        ...updatedUser.toObject(),
        picture: avatarUrl
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;