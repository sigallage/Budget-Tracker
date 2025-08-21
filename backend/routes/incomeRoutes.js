const express = require('express');
const router = express.Router();
const { checkJwt, getUserFromToken } = require('../middlewares/authMiddleware');
const Income = require('../models/Income');

// @desc    Get all incomes for a user
// @route   GET /api/income
// @access  Private
router.get('/', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const incomes = await Income.find({ 
      userId: req.user.sub,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching incomes' 
    });
  }
});

// @desc    Get income summary for a user
// @route   GET /api/income/summary
// @access  Private
router.get('/summary', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const incomes = await Income.find({ 
      userId: req.user.sub,
      isActive: true 
    });

    const summary = {
      totalSources: incomes.length,
      monthlyIncome: 0,
      yearlyIncome: 0,
      byCategory: {},
      byFrequency: {}
    };

    incomes.forEach(income => {
      // Calculate monthly equivalent
      summary.monthlyIncome += income.monthlyEquivalent;
      
      // Group by category
      if (!summary.byCategory[income.category]) {
        summary.byCategory[income.category] = {
          count: 0,
          totalMonthly: 0
        };
      }
      summary.byCategory[income.category].count++;
      summary.byCategory[income.category].totalMonthly += income.monthlyEquivalent;
      
      // Group by frequency
      if (!summary.byFrequency[income.frequency]) {
        summary.byFrequency[income.frequency] = {
          count: 0,
          totalAmount: 0
        };
      }
      summary.byFrequency[income.frequency].count++;
      summary.byFrequency[income.frequency].totalAmount += income.amount;
    });

    summary.yearlyIncome = summary.monthlyIncome * 12;

    res.json(summary);
  } catch (error) {
    console.error('Error calculating income summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while calculating summary' 
    });
  }
});

// @desc    Create new income
// @route   POST /api/income
// @access  Private
router.post('/', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const { source, amount, category, frequency, startDate, endDate, description, tags } = req.body;

    // Validation
    if (!source || !amount || !category || !frequency) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide all required fields: source, amount, category, frequency' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Amount must be greater than 0' 
      });
    }

    const income = new Income({
      userId: req.user.sub,
      source: source.trim(),
      amount: parseFloat(amount),
      category,
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      description: description?.trim() || '',
      tags: tags || []
    });

    await income.save();

    res.status(201).json({
      success: true,
      message: 'Income created successfully',
      income
    });
  } catch (error) {
    console.error('Error creating income:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation error', 
        details: errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error while creating income' 
    });
  }
});

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
router.put('/:id', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const { source, amount, category, frequency, startDate, endDate, description, tags } = req.body;

    // Find income and verify ownership
    const income = await Income.findOne({ 
      _id: req.params.id,
      userId: req.user.sub 
    });

    if (!income) {
      return res.status(404).json({ 
        success: false,
        error: 'Income not found' 
      });
    }

    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Amount must be greater than 0' 
      });
    }

    // Update fields
    if (source) income.source = source.trim();
    if (amount) income.amount = parseFloat(amount);
    if (category) income.category = category;
    if (frequency) income.frequency = frequency;
    if (startDate) income.startDate = new Date(startDate);
    if (endDate) income.endDate = new Date(endDate);
    if (description !== undefined) income.description = description.trim();
    if (tags) income.tags = tags;

    await income.save();

    res.json({
      success: true,
      message: 'Income updated successfully',
      income
    });
  } catch (error) {
    console.error('Error updating income:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation error', 
        details: errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error while updating income' 
    });
  }
});

// @desc    Delete income (soft delete)
// @route   DELETE /api/income/:id
// @access  Private
router.delete('/:id', checkJwt, getUserFromToken, async (req, res) => {
  try {
    // Find income and verify ownership
    const income = await Income.findOne({ 
      _id: req.params.id,
      userId: req.user.sub 
    });

    if (!income) {
      return res.status(404).json({ 
        success: false,
        error: 'Income not found' 
      });
    }

    // Soft delete by setting isActive to false
    income.isActive = false;
    await income.save();

    res.json({
      success: true,
      message: 'Income deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while deleting income' 
    });
  }
});

// @desc    Get income by ID
// @route   GET /api/income/:id
// @access  Private
router.get('/:id', checkJwt, getUserFromToken, async (req, res) => {
  try {
    const income = await Income.findOne({ 
      _id: req.params.id,
      userId: req.user.sub,
      isActive: true 
    });

    if (!income) {
      return res.status(404).json({ 
        success: false,
        error: 'Income not found' 
      });
    }

    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching income' 
    });
  }
});

module.exports = router;
