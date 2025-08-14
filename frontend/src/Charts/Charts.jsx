import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Charts.css';

const Charts = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchExpenses();
  }, [selectedPeriod]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      // Fetch all user's expenses from all groups
      const response = await axios.get('http://localhost:5000/api/expenses/user', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          period: selectedPeriod
        }
      });
      
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  const getExpensesByCategory = () => {
    const categories = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categories[category] = (categories[category] || 0) + expense.amount;
    });
    return categories;
  };

  const getExpensesByType = () => {
    const types = { personal: 0, gift: 0, split: 0 };
    expenses.forEach(expense => {
      types[expense.type] = (types[expense.type] || 0) + expense.amount;
    });
    return types;
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getMonthlyTrend = () => {
    const monthly = {};
    expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthly[month] = (monthly[month] || 0) + expense.amount;
    });
    return monthly;
  };

  const renderPieChart = (data, title) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="pie-chart-wrapper">
          <svg width="200" height="200" viewBox="0 0 200 200" className="pie-chart">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = (value / total) * 100;
              const angle = (value / total) * 360;
              const x1 = 100 + 80 * Math.cos((currentAngle - 90) * Math.PI / 180);
              const y1 = 100 + 80 * Math.sin((currentAngle - 90) * Math.PI / 180);
              const x2 = 100 + 80 * Math.cos((currentAngle + angle - 90) * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin((currentAngle + angle - 90) * Math.PI / 180);
              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                'M', 100, 100,
                'L', x1, y1,
                'A', 80, 80, 0, largeArcFlag, 1, x2, y2,
                'Z'
              ].join(' ');

              currentAngle += angle;

              return (
                <path
                  key={key}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="#1a1a1a"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="chart-legend">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="legend-label">
                  {key}: ${value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = (data, title) => {
    const maxValue = Math.max(...Object.values(data));
    if (maxValue === 0) return null;

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="bar-chart">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bar-item">
              <div className="bar-label">{key}</div>
              <div className="bar-wrapper">
                <div 
                  className="bar-fill" 
                  style={{ 
                    height: `${(value / maxValue) * 100}%`,
                    backgroundColor: '#3B82F6'
                  }}
                ></div>
              </div>
              <div className="bar-value">${value.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="charts-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your expense analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchExpenses} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const categoriesData = getExpensesByCategory();
  const typesData = getExpensesByType();
  const monthlyData = getMonthlyTrend();
  const totalExpenses = getTotalExpenses();

  return (
    <div className="charts-container">
      <div className="charts-header">
        <h1>Expense Analytics</h1>
        <div className="period-selector">
          <label>Period:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <p className="total-amount">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Number of Transactions</h3>
          <p className="total-count">{expenses.length}</p>
        </div>
        <div className="summary-card">
          <h3>Average Transaction</h3>
          <p className="average-amount">
            ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="charts-grid">
        {renderPieChart(categoriesData, 'Expenses by Category')}
        {renderPieChart(typesData, 'Expenses by Type')}
        {renderBarChart(monthlyData, 'Monthly Spending Trend')}
      </div>

      {expenses.length === 0 && (
        <div className="empty-state">
          <h3>No expenses found</h3>
          <p>Start tracking your expenses to see beautiful charts and analytics here!</p>
        </div>
      )}
    </div>
  );
};

export default Charts;
