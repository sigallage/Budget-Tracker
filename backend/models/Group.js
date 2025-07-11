const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['family', 'friends', 'roommates', 'trip', 'other'],
    default: 'other'
  },
  createdBy: {
    type: String, // Auth0 user ID
    required: true
  },
  members: [{
    type: String // Auth0 user IDs
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    defaultSplitMethod: {
      type: String,
      enum: ['equal', 'percentage', 'exact'],
      default: 'equal'
    },
    allowNonMemberExpenses: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
groupSchema.index({ inviteCode: 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ members: 1 });

// Method to generate unique invite code
groupSchema.methods.generateInviteCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Method to add member
groupSchema.methods.addMember = function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

// Method to remove member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member !== userId);
  return this.save();
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.createdBy === userId;
};

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.includes(userId);
};

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Pre-save middleware to generate invite code
groupSchema.pre('save', async function(next) {
  if (this.isNew && !this.inviteCode) {
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = this.generateInviteCode();
      const existing = await this.constructor.findOne({ inviteCode });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.inviteCode = inviteCode;
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
