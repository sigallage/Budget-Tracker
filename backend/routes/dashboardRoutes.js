const express = require('express');
const router = express.Router();
const { checkJwt, getUserFromToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');
//const Group = require('../models/Group');
//const Expense = require('../models/Expense');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const userId = req.user.dbUser._id;
    const { range = 'month' } = req.query;

    // Calculate date range
    const dateRange = calculateDateRange(range);

    // For now, return mock data until Group and Expense models are implemented
    const dashboardData = {
      user: {
        name: req.user.dbUser.name,
        email: req.user.dbUser.email,
        picture: req.user.dbUser.picture
      },
      summary: {
        totalSpent: 0,
        youOwe: 0,
        owedToYou: 0,
        netBalance: 0
      },
      balances: [],
      categories: [
        { name: 'Food & Dining', amount: 0 },
        { name: 'Transportation', amount: 0 },
        { name: 'Entertainment', amount: 0 },
        { name: 'Utilities', amount: 0 },
        { name: 'Other', amount: 0 }
      ],
      recentActivity: [],
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
        range: range
      }
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
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
  
  return { start, end };
}

// Future implementation functions (when Group and Expense models are ready)
function calculateSummary(userId, groups, expenses) {
  // Implement your summary calculation logic
  // This should return: { totalSpent, youOwe, owedToYou, netBalance }
  return {
    totalSpent: 0,
    youOwe: 0,
    owedToYou: 0,
    netBalance: 0
  };
}

function calculateBalances(userId, groups, expenses) {
  // Implement balances calculation per group
  // Return array of { groupId, groupName, members: [{ userId, name, amount }] }
  return [];
}

function calculateCategories(expenses) {
  // Implement category breakdown
  // Return array of { name, amount }
  return [
    { name: 'Food & Dining', amount: 0 },
    { name: 'Transportation', amount: 0 },
    { name: 'Entertainment', amount: 0 },
    { name: 'Utilities', amount: 0 },
    { name: 'Other', amount: 0 }
  ];
}

function getRecentActivity(expenses) {
  // Return recent expenses sorted by date
  // Format: { id, type, amount, description, date, payer: { name, avatar }, groupName }
  return [];
}

module.exports = router;