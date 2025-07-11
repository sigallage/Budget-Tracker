import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Calendar.css';

const Calendar = () => {
  console.log('Calendar component rendering');
  const { groupId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  useEffect(() => {
    console.log('Calendar component mounted');
    setLoading(false); // Just stop loading without API call
    setExpenses([]); // Set empty expenses array
    // fetchMonthExpenses(); // Comment out API call temporarily
  }, [currentDate, groupId]);

  const fetchMonthExpenses = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await axios.get(`/api/groups/${groupId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getExpensesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return expenses.filter(expense => 
      new Date(expense.date).toDateString() === dateStr
    );
  };

  const getTotalForDate = (date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getExpenseTypeIcon = (type) => {
    switch (type) {
      case 'personal': return '📝';
      case 'gift': return '🎁';
      case 'split': return '🔄';
      default: return '💰';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const selectedDayExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button 
            className="nav-btn" 
            onClick={() => navigateMonth(-1)}
          >
            ‹
          </button>
          <h1 className="calendar-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <button 
            className="nav-btn" 
            onClick={() => navigateMonth(1)}
          >
            ›
          </button>
        </div>
        
        <div className="calendar-actions">
          <button className="today-btn" onClick={goToToday}>
            Today
          </button>
          <div className="view-toggle">
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {viewMode === 'month' && (
          <div className="calendar-grid">
            <div className="weekdays">
              {weekDays.map(day => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="days-grid">
              {days.map((day, index) => {
                const dayExpenses = day ? getExpensesForDate(day) : [];
                const dayTotal = day ? getTotalForDate(day) : 0;
                const isToday = day && day.toDateString() === new Date().toDateString();
                const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayExpenses.length > 0 ? 'has-expenses' : ''}`}
                    onClick={() => day && setSelectedDate(day)}
                  >
                    {day && (
                      <>
                        <div className="day-number">{day.getDate()}</div>
                        {dayExpenses.length > 0 && (
                          <div className="day-summary">
                            <div className="expense-count">
                              {dayExpenses.length} expense{dayExpenses.length !== 1 ? 's' : ''}
                            </div>
                            <div className="day-total">
                              {formatCurrency(dayTotal)}
                            </div>
                          </div>
                        )}
                        {dayExpenses.slice(0, 2).map(expense => (
                          <div key={expense.id} className="day-expense-preview">
                            <span className="expense-icon">
                              {getExpenseTypeIcon(expense.type)}
                            </span>
                            <span className="expense-preview-amount">
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                        ))}
                        {dayExpenses.length > 2 && (
                          <div className="more-expenses">
                            +{dayExpenses.length - 2} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedDate && (
          <div className="day-details">
            <div className="day-details-header">
              <h2>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <button 
                className="close-details" 
                onClick={() => setSelectedDate(null)}
              >
                ✕
              </button>
            </div>
            
            {selectedDayExpenses.length === 0 ? (
              <div className="no-expenses">
                <div className="no-expenses-icon">📅</div>
                <h3>No expenses on this day</h3>
                <p>This day is expense-free!</p>
              </div>
            ) : (
              <>
                <div className="day-summary-stats">
                  <div className="stat">
                    <span className="stat-value">{selectedDayExpenses.length}</span>
                    <span className="stat-label">Expenses</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {formatCurrency(getTotalForDate(selectedDate))}
                    </span>
                    <span className="stat-label">Total Spent</span>
                  </div>
                </div>
                
                <div className="day-expenses-list">
                  {selectedDayExpenses.map(expense => (
                    <div key={expense.id} className="day-expense-item">
                      <div className="expense-icon-large">
                        {getExpenseTypeIcon(expense.type)}
                      </div>
                      <div className="expense-details">
                        <div className="expense-main-info">
                          <h3>{expense.description}</h3>
                          <span className="expense-amount">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>
                        <div className="expense-meta-info">
                          <span className="expense-payer">
                            Paid by {expense.payer.name}
                          </span>
                          <span className="expense-category">
                            {expense.category}
                          </span>
                          <span className="expense-time">
                            {new Date(expense.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {expense.type === 'gift' && expense.recipient && (
                          <div className="expense-type-detail">
                            🎁 Gift to {expense.recipient.name}
                          </div>
                        )}
                        {expense.type === 'split' && expense.splitMembers && (
                          <div className="expense-type-detail">
                            🔄 Split among {expense.splitMembers.length} members
                          </div>
                        )}
                        {expense.notes && (
                          <div className="expense-notes">
                            "{expense.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="calendar-summary">
        <div className="month-stats">
          <div className="stat-card">
            <h3>This Month</h3>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-number">{expenses.length}</span>
                <span className="stat-text">Total Expenses</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {formatCurrency(expenses.reduce((total, expense) => total + expense.amount, 0))}
                </span>
                <span className="stat-text">Total Amount</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {formatCurrency(expenses.reduce((total, expense) => total + expense.amount, 0) / (expenses.length || 1))}
                </span>
                <span className="stat-text">Average Expense</span>
              </div>
            </div>
          </div>
          
          <div className="expense-types-breakdown">
            <h3>Expense Types</h3>
            <div className="type-stats">
              {['personal', 'gift', 'split'].map(type => {
                const typeExpenses = expenses.filter(e => e.type === type);
                const typeTotal = typeExpenses.reduce((total, expense) => total + expense.amount, 0);
                return (
                  <div key={type} className="type-stat">
                    <div className="type-header">
                      <span className="type-icon">{getExpenseTypeIcon(type)}</span>
                      <span className="type-name">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </div>
                    <div className="type-details">
                      <span className="type-count">{typeExpenses.length} expenses</span>
                      <span className="type-amount">{formatCurrency(typeTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
