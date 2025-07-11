import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
import expenseService from '../services/expenseService';
import './AddExpense.css';

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  
  // Initialize expense service
  useEffect(() => {
    expenseService.setAuthToken(getAccessTokenSilently);
  }, [getAccessTokenSilently]);
  
  const [expense, setExpense] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    type: 'personal', // personal, gift, split
    paidBy: '', // user ID who paid
    splitWith: [], // array of user IDs to split with
    notes: ''
  });

  const categories = [
    'food', 'transportation', 'shopping', 'entertainment', 
    'utilities', 'healthcare', 'education', 'other'
  ];

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  const fetchGroupMembers = async () => {
    try {
      // For now, using mock data since backend group endpoints aren't ready
      // TODO: Replace with actual API call when group endpoints are implemented
      const mockMembers = [
        { id: 'user1', name: 'John Doe', email: 'john@example.com', isCurrentUser: true },
        { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', isCurrentUser: false },
        { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', isCurrentUser: false },
        { id: 'user4', name: 'Alice Brown', email: 'alice@example.com', isCurrentUser: false }
      ];
      
      setGroupMembers(mockMembers);
      // Set current user as default payer
      const currentUser = mockMembers.find(member => member.isCurrentUser);
      if (currentUser) {
        setExpense(prev => ({ ...prev, paidBy: currentUser.id }));
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    
    try {
      // Prepare expense data
      const expenseData = {
        description: expense.description.trim(),
        amount: parseFloat(expense.amount),
        category: expense.category,
        date: expense.date,
        type: expense.type,
        splitWith: expense.splitWith,
        notes: expense.notes.trim()
      };

      // Validate expense data
      const validation = expenseService.validateExpenseData(expenseData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Create expense using service
      const createdExpense = await expenseService.createExpense(groupId, expenseData);
      console.log('Expense created:', createdExpense);
      
      // Navigate back to group
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Error adding expense:', error);
      setErrors([error.message]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSplitToggle = (memberId) => {
    setExpense(prev => ({
      ...prev,
      splitWith: prev.splitWith.includes(memberId)
        ? prev.splitWith.filter(id => id !== memberId)
        : [...prev.splitWith, memberId]
    }));
  };

  const getExpenseTypeDescription = () => {
    switch (expense.type) {
      case 'personal':
        return 'This expense will only be shown to group members, no splitting involved.';
      case 'gift':
        return 'This expense represents money given to someone else, no debt created.';
      case 'split':
        return 'This expense will be split equally among selected members.';
      default:
        return '';
    }
  };

  // Calculate split amount per person
  const calculateSplitAmount = () => {
    if (!expense.amount || expense.type !== 'split') return 0;
    const totalPeople = expense.splitWith.length + 1; // +1 for payer
    return totalPeople > 0 ? (parseFloat(expense.amount) / totalPeople) : 0;
  };

  // Get split preview text
  const getSplitPreview = () => {
    if (expense.type !== 'split' || !expense.amount) return '';
    const splitAmount = calculateSplitAmount();
    const totalPeople = expense.splitWith.length + 1;
    return `Split ${totalPeople} ways: $${splitAmount.toFixed(2)} each`;
  };

  // Reset split members when expense type changes
  const handleTypeChange = (newType) => {
    setExpense(prev => ({
      ...prev,
      type: newType,
      splitWith: newType === 'personal' ? [] : prev.splitWith
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading group information...</p>
      </div>
    );
  }

  return (
    <div className="add-expense-container">
      <div className="add-expense-header">
        <button 
          className="back-btn"
          onClick={() => navigate(`/groups/${groupId}`)}
        >
          ← Back to Group
        </button>
        <h1>Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        {errors.length > 0 && (
          <div className="error-container">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="description">What was this for?</label>
            <input
              type="text"
              id="description"
              value={expense.description}
              onChange={(e) => setExpense({...expense, description: e.target.value})}
              required
              placeholder="e.g., Groceries, Dinner, Gas"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="amount-input">
              <span className="currency">$</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={expense.amount}
                onChange={(e) => setExpense({...expense, amount: e.target.value})}
                required
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={expense.category}
              onChange={(e) => setExpense({...expense, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={expense.date}
              onChange={(e) => setExpense({...expense, date: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="paidBy">Who paid?</label>
          <select
            id="paidBy"
            value={expense.paidBy}
            onChange={(e) => setExpense({...expense, paidBy: e.target.value})}
            required
          >
            {groupMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} {member.isCurrentUser ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Expense Type</label>
          <div className="expense-types">
            <div 
              className={`expense-type ${expense.type === 'personal' ? 'active' : ''}`}
              onClick={() => handleTypeChange('personal')}
            >
              <div className="type-icon">📝</div>
              <div className="type-info">
                <h3>Personal Expense</h3>
                <p>Just record for the group to see</p>
              </div>
            </div>
            
            <div 
              className={`expense-type ${expense.type === 'gift' ? 'active' : ''}`}
              onClick={() => handleTypeChange('gift')}
            >
              <div className="type-icon">🎁</div>
              <div className="type-info">
                <h3>Gift/Transfer</h3>
                <p>Money given to family member</p>
              </div>
            </div>
            
            <div 
              className={`expense-type ${expense.type === 'split' ? 'active' : ''}`}
              onClick={() => handleTypeChange('split')}
            >
              <div className="type-icon">🔄</div>
              <div className="type-info">
                <h3>Split Expense</h3>
                <p>Divide cost among group members</p>
              </div>
            </div>
          </div>
          <p className="type-description">{getExpenseTypeDescription()}</p>
        </div>

        {expense.type === 'split' && (
          <div className="form-group">
            <label>Split with:</label>
            <div className="members-list">
              {groupMembers.map(member => (
                <div 
                  key={member.id} 
                  className={`member-item ${expense.splitWith.includes(member.id) ? 'selected' : ''}`}
                  onClick={() => handleSplitToggle(member.id)}
                >
                  <img 
                    src={member.avatar || '/default-avatar.png'} 
                    alt={member.name}
                    className="member-avatar"
                  />
                  <span className="member-name">
                    {member.name} {member.isCurrentUser ? '(You)' : ''}
                  </span>
                  <div className="member-checkbox">
                    {expense.splitWith.includes(member.id) && '✓'}
                  </div>
                </div>
              ))}
            </div>
            {expense.splitWith.length > 0 && expense.amount && (
              <div className="split-preview">
                <p className="split-info">{getSplitPreview()}</p>
                <div className="split-breakdown">
                  <span>You pay: ${calculateSplitAmount().toFixed(2)}</span>
                  <span>Others owe you: ${(calculateSplitAmount() * expense.splitWith.length).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {expense.type === 'gift' && (
          <div className="form-group">
            <label>Gift recipients:</label>
            <div className="members-list">
              {groupMembers.filter(member => !member.isCurrentUser).map(member => (
                <div 
                  key={member.id} 
                  className={`member-item ${expense.splitWith.includes(member.id) ? 'selected' : ''}`}
                  onClick={() => handleSplitToggle(member.id)}
                >
                  <img 
                    src={member.avatar || '/default-avatar.png'} 
                    alt={member.name}
                    className="member-avatar"
                  />
                  <span className="member-name">{member.name}</span>
                  <div className="member-checkbox">
                    {expense.splitWith.includes(member.id) && '✓'}
                  </div>
                </div>
              ))}
            </div>
            {expense.splitWith.length > 0 && (
              <p className="gift-info">
                Gift amount: ${expense.amount || '0.00'} to {expense.splitWith.length} recipient(s)
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            value={expense.notes}
            onChange={(e) => setExpense({...expense, notes: e.target.value})}
            placeholder="Any additional details..."
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate(`/groups/${groupId}`)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
