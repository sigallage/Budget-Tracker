const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['food', 'transportation', 'shopping', 'entertainment', 'utilities', 'healthcare', 'education', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['personal', 'gift', 'split'],
    default: 'personal'
  },
  paidBy: {
    type: String, // Auth0 user ID
    required: true
  },
  splitWith: [{
    user: {
      type: String, // Auth0 user ID
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    settled: {
      type: Boolean,
      default: false
    },
    settledAt: {
      type: Date
    }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: String, // Auth0 user ID
    required: true
  },
  receipt: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splitWith.user': 1 });

// Virtual for checking if expense is fully settled
expenseSchema.virtual('isFullySettled').get(function() {
  if (this.type !== 'split' || this.splitWith.length === 0) {
    return true;
  }
  return this.splitWith.every(split => split.settled);
});

// Method to calculate user's share in this expense
expenseSchema.methods.getUserShare = function(userId) {
  if (this.type === 'personal') {
    return this.paidBy === userId ? this.amount : 0;
  }
  
  if (this.type === 'gift') {
    if (this.paidBy === userId) {
      return this.amount; // Payer spent the money
    }
    const isRecipient = this.splitWith.some(split => split.user === userId);
    return isRecipient ? 0 : 0; // Recipients don't owe anything
  }
  
  if (this.type === 'split') {
    const userSplit = this.splitWith.find(split => split.user === userId);
    return userSplit ? userSplit.amount : 0;
  }
  
  return 0;
};

// Method to calculate how much user owes for this expense
expenseSchema.methods.getUserOwes = function(userId) {
  if (this.paidBy === userId) {
    return 0; // Payer doesn't owe anything
  }
  
  if (this.type === 'split') {
    const userSplit = this.splitWith.find(split => split.user === userId);
    return userSplit && !userSplit.settled ? userSplit.amount : 0;
  }
  
  return 0;
};

// Method to calculate how much user is owed for this expense
expenseSchema.methods.getUserIsOwed = function(userId) {
  if (this.paidBy !== userId || this.type !== 'split') {
    return 0;
  }
  
  return this.splitWith
    .filter(split => split.user !== userId && !split.settled)
    .reduce((total, split) => total + split.amount, 0);
};

module.exports = mongoose.model('Expense', expenseSchema);
