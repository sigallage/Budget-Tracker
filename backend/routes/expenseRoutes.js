const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middlewares/authMiddleware');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');

// Get all expenses for a group
router.get('/groups/:groupId/expenses', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expenses = await Expense.find({ groupId })
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create a new expense
router.post('/groups/:groupId/expenses', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;
    const { description, amount, category, date, type, splitWith, notes } = req.body;

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate required fields
    if (!description || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Description and valid amount are required' });
    }

    // Create expense object
    const expenseData = {
      groupId,
      description,
      amount: parseFloat(amount),
      category: category || 'other',
      date: date || new Date(),
      type: type || 'personal',
      paidBy: userId,
      notes: notes || '',
      createdBy: userId
    };

    // Handle split logic based on expense type
    if (type === 'split' && splitWith && splitWith.length > 0) {
      // Validate split members are in the group
      const validMembers = splitWith.filter(memberId => 
        group.members.includes(memberId)
      );
      
      if (validMembers.length === 0) {
        return res.status(400).json({ error: 'Invalid split members' });
      }

      // Calculate split amounts
      const splitAmount = parseFloat(amount) / (validMembers.length + 1); // +1 for payer
      
      expenseData.splitWith = validMembers.map(memberId => ({
        user: memberId,
        amount: splitAmount,
        settled: false
      }));

      // Add payer to split if they're not already included
      if (!validMembers.includes(userId)) {
        expenseData.splitWith.push({
          user: userId,
          amount: splitAmount,
          settled: true // Payer is automatically settled
        });
      } else {
        // Mark payer as settled
        const payerSplit = expenseData.splitWith.find(split => split.user === userId);
        if (payerSplit) {
          payerSplit.settled = true;
        }
      }
    } else if (type === 'gift' && splitWith && splitWith.length > 0) {
      // For gifts, only the recipient(s) benefit, payer doesn't owe anything
      expenseData.splitWith = splitWith.map(memberId => ({
        user: memberId,
        amount: 0, // Gift recipients don't owe money
        settled: true
      }));
    }

    const expense = new Expense(expenseData);
    await expense.save();

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update an expense
router.put('/expenses/:expenseId', checkJwt, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.sub;
    const updates = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Only allow creator or group admin to update
    if (expense.createdBy !== userId) {
      const group = await Group.findById(expense.groupId);
      if (!group || group.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Update expense
    Object.assign(expense, updates);
    await expense.save();

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete an expense
router.delete('/expenses/:expenseId', checkJwt, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.sub;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Only allow creator or group admin to delete
    if (expense.createdBy !== userId) {
      const group = await Group.findById(expense.groupId);
      if (!group || group.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await Expense.findByIdAndDelete(expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Settle a split expense
router.put('/expenses/:expenseId/settle', checkJwt, async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.sub;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Find user's split in the expense
    const userSplit = expense.splitWith.find(split => split.user.toString() === userId);
    if (!userSplit) {
      return res.status(404).json({ error: 'User not found in expense split' });
    }

    // Mark as settled
    userSplit.settled = true;
    userSplit.settledAt = new Date();
    
    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email picture')
      .populate('splitWith.user', 'name email picture');

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error settling expense:', error);
    res.status(500).json({ error: 'Failed to settle expense' });
  }
});

// Get expense statistics for a group
router.get('/groups/:groupId/expenses/stats', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expenses = await Expense.find({ groupId });

    const stats = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      byCategory: {},
      byType: {
        personal: 0,
        gift: 0,
        split: 0
      },
      userBalance: 0 // Amount user owes or is owed
    };

    // Calculate category breakdown
    expenses.forEach(expense => {
      stats.byCategory[expense.category] = (stats.byCategory[expense.category] || 0) + expense.amount;
      stats.byType[expense.type] += expense.amount;
    });

    // Calculate user balance
    let userOwes = 0;
    let userIsOwed = 0;

    expenses.forEach(expense => {
      if (expense.paidBy === userId) {
        // User paid for this expense
        if (expense.type === 'split') {
          const otherSplits = expense.splitWith.filter(split => 
            split.user.toString() !== userId && !split.settled
          );
          userIsOwed += otherSplits.reduce((sum, split) => sum + split.amount, 0);
        }
      } else {
        // Someone else paid
        const userSplit = expense.splitWith.find(split => split.user.toString() === userId);
        if (userSplit && !userSplit.settled) {
          userOwes += userSplit.amount;
        }
      }
    });

    stats.userBalance = userIsOwed - userOwes;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
});

// Get all expenses for a user across all groups
router.get('/user', checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { period } = req.query;

    // Find all groups user is a member of
    const userGroups = await Group.find({ members: userId });
    const groupIds = userGroups.map(group => group._id);

    // Calculate date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = { 
          date: { 
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) 
          } 
        };
        break;
      case 'month':
        dateFilter = { 
          date: { 
            $gte: new Date(now.getFullYear(), now.getMonth(), 1) 
          } 
        };
        break;
      case 'year':
        dateFilter = { 
          date: { 
            $gte: new Date(now.getFullYear(), 0, 1) 
          } 
        };
        break;
      default:
        // 'all' or no period - no date filter
        break;
    }

    // Find all expenses in user's groups
    const query = {
      groupId: { $in: groupIds },
      ...dateFilter
    };

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.json({ 
      expenses,
      totalGroups: userGroups.length,
      period: period || 'all'
    });
  } catch (error) {
    console.error('Error fetching user expenses:', error);
    res.status(500).json({ error: 'Failed to fetch user expenses' });
  }
});

module.exports = router;
