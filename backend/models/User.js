const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  picture: {
    type: String,
    required: false
  },
  currencyPreference: {
    type: String,
    default: 'USD',
    enum: [
      'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'KRW',
      'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'TRY',
      'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'ZAR', 'EGP', 'AED', 'SAR', 'QAR',
      'KWD', 'BHD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'TWD', 'NZD', 'ILS',
      'PKR', 'BDT', 'LKR', 'NPR', 'MMK', 'KHR', 'LAK'
    ]
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);