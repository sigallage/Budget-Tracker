const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  userId: {
    type: String, // Auth0 user ID
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['salary', 'freelance', 'business', 'investment', 'rental', 'pension', 'benefits', 'other'],
    default: 'salary'
  },
  frequency: {
    type: String,
    required: true,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: false // Optional for ongoing income
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
IncomeSchema.index({ userId: 1 });
IncomeSchema.index({ category: 1 });
IncomeSchema.index({ frequency: 1 });
IncomeSchema.index({ createdAt: -1 });

// Virtual for monthly equivalent amount
IncomeSchema.virtual('monthlyEquivalent').get(function() {
  let monthlyAmount = this.amount;
  
  switch (this.frequency) {
    case 'weekly':
      monthlyAmount = this.amount * 4.33; // Average weeks per month
      break;
    case 'bi-weekly':
      monthlyAmount = this.amount * 2.17; // Average bi-weeks per month
      break;
    case 'quarterly':
      monthlyAmount = this.amount / 3;
      break;
    case 'yearly':
      monthlyAmount = this.amount / 12;
      break;
    case 'one-time':
      monthlyAmount = 0; // Don't include in regular monthly calculations
      break;
    default: // monthly
      monthlyAmount = this.amount;
  }
  
  return Math.round(monthlyAmount * 100) / 100; // Round to 2 decimal places
});

// Virtual for yearly equivalent amount
IncomeSchema.virtual('yearlyEquivalent').get(function() {
  return this.monthlyEquivalent * 12;
});

// Ensure virtual fields are serialized
IncomeSchema.set('toJSON', { virtuals: true });
IncomeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Income', IncomeSchema);
