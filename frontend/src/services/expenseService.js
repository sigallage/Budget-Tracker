// expenseService.js - Utility functions for expense management

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ExpenseService {
  // Set the auth token for API requests
  setAuthToken(getAccessTokenSilently) {
    this.getToken = getAccessTokenSilently;
  }

  // Get auth headers
  async getAuthHeaders() {
    if (!this.getToken) {
      throw new Error('Auth token not set. Call setAuthToken first.');
    }
    const token = await this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Create a new expense
  async createExpense(groupId, expenseData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/expenses/groups/${groupId}/expenses`,
        expenseData,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all expenses for a group
  async getGroupExpenses(groupId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/expenses/groups/${groupId}/expenses`,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update an expense
  async updateExpense(expenseId, updateData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put(
        `${API_BASE_URL}/expenses/${expenseId}`,
        updateData,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete an expense
  async deleteExpense(expenseId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.delete(
        `${API_BASE_URL}/expenses/${expenseId}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Settle a split expense
  async settleExpense(expenseId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put(
        `${API_BASE_URL}/expenses/${expenseId}/settle`,
        {},
        { headers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get expense statistics for a group
  async getExpenseStats(groupId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/expenses/groups/${groupId}/expenses/stats`,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Calculate balance for a user in a group
  calculateUserBalance(expenses, userId) {
    let userOwes = 0;
    let userIsOwed = 0;

    expenses.forEach(expense => {
      if (expense.paidBy === userId) {
        // User paid for this expense
        if (expense.type === 'split') {
          const unsettledSplits = expense.splitWith.filter(split => 
            split.user !== userId && !split.settled
          );
          userIsOwed += unsettledSplits.reduce((sum, split) => sum + split.amount, 0);
        }
      } else {
        // Someone else paid
        const userSplit = expense.splitWith.find(split => split.user === userId);
        if (userSplit && !userSplit.settled) {
          userOwes += userSplit.amount;
        }
      }
    });

    return {
      owes: userOwes,
      isOwed: userIsOwed,
      balance: userIsOwed - userOwes
    };
  }

  // Get expenses by date range
  filterExpensesByDateRange(expenses, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  }

  // Group expenses by category
  groupExpensesByCategory(expenses) {
    return expenses.reduce((groups, expense) => {
      const category = expense.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(expense);
      return groups;
    }, {});
  }

  // Calculate category totals
  calculateCategoryTotals(expenses) {
    return expenses.reduce((totals, expense) => {
      const category = expense.category || 'other';
      totals[category] = (totals[category] || 0) + expense.amount;
      return totals;
    }, {});
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
  }

  // Validate expense data
  validateExpenseData(expenseData) {
    const errors = [];

    if (!expenseData.description || expenseData.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!expenseData.amount || expenseData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (expenseData.type === 'split' && (!expenseData.splitWith || expenseData.splitWith.length === 0)) {
      errors.push('Split expenses must have at least one person to split with');
    }

    if (expenseData.type === 'gift' && (!expenseData.splitWith || expenseData.splitWith.length === 0)) {
      errors.push('Gift expenses must have at least one recipient');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.statusText;
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Calculate split amounts for equal division
  calculateEqualSplit(totalAmount, numberOfPeople) {
    if (numberOfPeople <= 0) return 0;
    return totalAmount / numberOfPeople;
  }

  // Generate expense summary
  generateExpenseSummary(expenses) {
    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      byType: {
        personal: 0,
        gift: 0,
        split: 0
      },
      byCategory: {},
      recentExpenses: expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
    };

    expenses.forEach(expense => {
      // Count by type
      summary.byType[expense.type] += expense.amount;

      // Count by category
      const category = expense.category || 'other';
      summary.byCategory[category] = (summary.byCategory[category] || 0) + expense.amount;
    });

    return summary;
  }
}

// Create and export singleton instance
const expenseService = new ExpenseService();
export default expenseService;
