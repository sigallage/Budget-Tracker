const express = require('express');
const router = express.Router();
const { checkJwt, getUserFromToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.dbUser._id;
    const { range } = req.query;

    // Calculate date range
    const dateRange = calculateDateRange(range);

    // Get user's groups
    const groups = await Group.find({ members: userId }).populate('members', 'name email picture');

    // Get expenses
    const expenses = await Expense.find({
      group: { $in: groups.map(g => g._id) },
      date: { $gte: dateRange.start, $lte: dateRange.end }
    }).populate('payer', 'name picture');

    // Calculate dashboard data
    const dashboardData = {
      user: {
        name: req.user.dbUser.name,
        email: req.user.dbUser.email,
        picture: req.user.dbUser.picture
      },
      summary: calculateSummary(userId, groups, expenses),
      balances: calculateBalances(userId, groups, expenses),
      categories: calculateCategories(expenses),
      recentActivity: getRecentActivity(expenses)
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
function calculateDateRange(range) {
  const now = new Date();
  let start, end = new Date();
  
  switch(range) {
    case 'week':
      start = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'year':
      start = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'month':
    default:
      start = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  return { start, end };
}

function calculateSummary(userId, groups, expenses) {
  // Implement your summary calculation logic
  // This should return: { totalSpent, youOwe, owedToYou, netBalance }
}

function calculateBalances(userId, groups, expenses) {
  // Implement balances calculation per group
  // Return array of { groupId, groupName, members: [{ userId, name, amount }] }
}

function calculateCategories(expenses) {
  // Implement category breakdown
  // Return array of { name, amount }
}

function getRecentActivity(expenses) {
  // Return recent expenses sorted by date
  // Format: { id, type, amount, description, date, payer: { name, avatar }, groupName }
}

module.exports = router;