const express = require('express');
const router = express.Router();
const { checkJwt, getUserFromToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.dbUser._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

    // Construct avatar URL
    const avatarUrl = user.avatar 
      ? `/avatars/${path.basename(user.avatar)}`
      : null;

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
        updateData.avatar = req.file.path;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.dbUser._id,
        updateData,
        { new: true }
      ).select('-__v -createdAt -updatedAt');

      // Construct avatar URL
      const avatarUrl = updatedUser.avatar 
        ? `/avatars/${path.basename(updatedUser.avatar)}`
        : null;

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

// Serve avatar images
router.use('/avatars', express.static(path.join(__dirname, '../uploads/avatars')));

module.exports = router;