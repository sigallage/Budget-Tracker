import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Income.css';

const Income = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    category: 'salary'
  });

  const incomeCategories = [
    { value: 'salary', label: 'Salary', icon: '💼' },
    { value: 'freelance', label: 'Freelance', icon: '🎨' },
    { value: 'business', label: 'Business', icon: '🏢' },
    { value: 'investment', label: 'Investment', icon: '📈' },
    { value: 'rental', label: 'Rental Income', icon: '🏠' },
    { value: 'pension', label: 'Pension', icon: '👴' },
    { value: 'benefits', label: 'Benefits', icon: '🎁' },
    { value: 'other', label: 'Other', icon: '💰' }
  ];

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'one-time', label: 'One-time' }
  ];

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get('http://localhost:5000/api/income', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setIncomes(response.data);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      
      if (editingIncome) {
        // Update existing income
        await axios.put(`http://localhost:5000/api/income/${editingIncome._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Create new income
        await axios.post('http://localhost:5000/api/income', formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      fetchIncomes();
      resetForm();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Error saving income. Please try again.');
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setFormData({
      source: income.source,
      amount: income.amount.toString(),
      frequency: income.frequency,
      startDate: income.startDate.split('T')[0],
      description: income.description || '',
      category: income.category
    });
    setShowForm(true);
  };

  const handleDelete = async (incomeId) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        const token = await getAccessTokenSilently();
        await axios.delete(`http://localhost:5000/api/income/${incomeId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchIncomes();
      } catch (error) {
        console.error('Error deleting income:', error);
        alert('Error deleting income. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      description: '',
      category: 'salary'
    });
    setEditingIncome(null);
    setShowForm(false);
  };

  const calculateMonthlyIncome = () => {
    return incomes.reduce((total, income) => {
      let monthlyAmount = income.amount;
      
      switch (income.frequency) {
        case 'weekly':
          monthlyAmount = income.amount * 4.33;
          break;
        case 'bi-weekly':
          monthlyAmount = income.amount * 2.17;
          break;
        case 'quarterly':
          monthlyAmount = income.amount / 3;
          break;
        case 'yearly':
          monthlyAmount = income.amount / 12;
          break;
        case 'one-time':
          monthlyAmount = 0; // Don't include one-time in monthly calculation
          break;
        default: // monthly
          monthlyAmount = income.amount;
      }
      
      return total + monthlyAmount;
    }, 0);
  };

  const calculateYearlyIncome = () => {
    return calculateMonthlyIncome() * 12;
  };

  const getCategoryIcon = (category) => {
    const cat = incomeCategories.find(c => c.value === category);
    return cat ? cat.icon : '💰';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="income-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="income-container">
      <div className="income-header">
        <h1>Income Management</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Income'}
        </button>
      </div>

      {/* Income Summary */}
      <div className="income-summary">
        <div className="summary-card">
          <h3>Monthly Income</h3>
          <div className="summary-amount">{formatCurrency(calculateMonthlyIncome())}</div>
        </div>
        <div className="summary-card">
          <h3>Yearly Income</h3>
          <div className="summary-amount">{formatCurrency(calculateYearlyIncome())}</div>
        </div>
        <div className="summary-card">
          <h3>Income Sources</h3>
          <div className="summary-amount">{incomes.length}</div>
        </div>
      </div>

      {/* Income Form */}
      {showForm && (
        <div className="income-form-container">
          <div className="form-header">
            <h2>{editingIncome ? 'Edit Income' : 'Add New Income'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="income-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source">Income Source</label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="e.g., Google, Freelance Client"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {incomeCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="frequency">Frequency</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional notes about this income source..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingIncome ? 'Update Income' : 'Add Income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      <div className="income-list">
        <h2>Your Income Sources</h2>
        {incomes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No Income Sources Yet</h3>
            <p>Add your first income source to start tracking your earnings!</p>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              Add Income
            </button>
          </div>
        ) : (
          <div className="income-grid">
            {incomes.map(income => (
              <div key={income._id} className="income-card">
                <div className="income-card-header">
                  <div className="income-category">
                    <span className="category-icon">{getCategoryIcon(income.category)}</span>
                    <span className="income-source">{income.source}</span>
                  </div>
                  <div className="income-actions">
                    <button 
                      onClick={() => handleEdit(income)}
                      className="action-btn edit-btn"
                      title="Edit Income"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(income._id)}
                      className="action-btn delete-btn"
                      title="Delete Income"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="income-details">
                  <div className="income-amount">{formatCurrency(income.amount)}</div>
                  <div className="income-frequency">{income.frequency}</div>
                  <div className="income-date">Since: {new Date(income.startDate).toLocaleDateString()}</div>
                  {income.description && (
                    <div className="income-description">{income.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Income;
