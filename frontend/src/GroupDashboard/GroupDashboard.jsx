import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './GroupDashboard.css';

const GroupDashboard = () => {
  const { groupId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, year

  useEffect(() => {
    fetchGroupData();
  }, [groupId, timeFilter]);

  const fetchGroupData = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeFilter }
      });
      setGroupData(response.data);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const settleBalance = async (memberId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`http://localhost:5000/api/groups/${groupId}/settle`, 
        { memberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchGroupData(); // Refresh data
    } catch (error) {
      console.error('Error settling balance:', error);
    }
  };

  const getExpenseTypeIcon = (type) => {
    switch (type) {
      case 'personal': return '📝';
      case 'gift': return '🎁';
      case 'split': return '🔄';
      default: return '💰';
    }
  };

  const getExpenseTypeLabel = (expense) => {
    switch (expense.type) {
      case 'personal':
        return 'Personal Expense';
      case 'gift':
        return `Gift to ${expense.recipient?.name || 'Unknown'}`;
      case 'split':
        return `Split among ${expense.splitMembers?.length || 0} members`;
      default:
        return 'Expense';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading group dashboard...</p>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="error-container">
        <h2>Group not found</h2>
        <Link to="/groups" className="btn-primary">Back to Groups</Link>
      </div>
    );
  }

  return (
    <div className="group-dashboard-container">
      <div className="group-header">
        <div className="group-info">
          <Link to="/groups" className="back-link">← Back to Groups</Link>
          <h1>{groupData.name}</h1>
          <p className="group-description">{groupData.description}</p>
          <div className="group-meta">
            <span className={`group-type ${groupData.type}`}>
              {groupData.type}
            </span>
            <span className="member-count">
              {groupData.members.length} members
            </span>
          </div>
        </div>
        <div className="group-actions">
          <Link 
            to={`/groups/${groupId}/add-expense`} 
            className="btn-primary"
          >
            + Add Expense
          </Link>
          <Link 
            to={`/groups/${groupId}/calendar`} 
            className="btn-secondary"
          >
            📅 Calendar
          </Link>
          <button 
            className="btn-secondary"
            onClick={() => setActiveTab('members')}
          >
            👥 Members
          </button>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="time-filter">
          <label>Time Period:</label>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'expenses' ? 'active' : ''}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </button>
        <button 
          className={activeTab === 'balances' ? 'active' : ''}
          onClick={() => setActiveTab('balances')}
        >
          Balances
        </button>
        <button 
          className={activeTab === 'members' ? 'active' : ''}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
        <button 
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
      </div>

      {activeTab === 'expenses' && (
        <div className="expenses-section">
          <div className="section-header">
            <h2>Group Expenses</h2>
            <div className="expense-stats">
              <div className="stat">
                <span className="stat-value">${groupData.totalExpenses?.toFixed(2) || '0.00'}</span>
                <span className="stat-label">Total Spent</span>
              </div>
              <div className="stat">
                <span className="stat-value">{groupData.expenses?.length || 0}</span>
                <span className="stat-label">Expenses</span>
              </div>
            </div>
          </div>
          
          <div className="expenses-list">
            {groupData.expenses?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💸</div>
                <h3>No expenses yet</h3>
                <p>Start by adding your first expense</p>
                <Link 
                  to={`/groups/${groupId}/add-expense`} 
                  className="btn-primary"
                >
                  Add First Expense
                </Link>
              </div>
            ) : (
              groupData.expenses?.map(expense => (
                <div key={expense._id || expense.id} className="expense-item">
                  <div className="expense-icon">
                    {getExpenseTypeIcon(expense.type)}
                  </div>
                  <div className="expense-details">
                    <div className="expense-main">
                      <h3>{expense.description}</h3>
                      <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                    </div>
                    <div className="expense-meta">
                      <span className="expense-payer">
                        Paid by {expense.payer.name}
                      </span>
                      <span className="expense-date">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                      <span className="expense-category">
                        {expense.category}
                      </span>
                    </div>
                    <div className="expense-type-info">
                      {getExpenseTypeLabel(expense)}
                    </div>
                    {expense.notes && (
                      <div className="expense-notes">
                        "{expense.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="balances-section">
          <h2>Member Balances</h2>
          <div className="balances-grid">
            {groupData.members?.map(member => (
              <div key={member._id || member.id} className="balance-card">
                <div className="member-info">
                  <img 
                    src={member.avatar || '/default-avatar.png'} 
                    alt={member.name}
                    className="member-avatar"
                  />
                  <div className="member-details">
                    <h3>{member.name}</h3>
                    <p className="member-role">{member.role || 'Member'}</p>
                  </div>
                </div>
                
                <div className="balance-info">
                  <div className="balance-stats">
                    <div className="stat">
                      <span className="stat-value">${member.totalPaid?.toFixed(2) || '0.00'}</span>
                      <span className="stat-label">Total Paid</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">${member.totalOwed?.toFixed(2) || '0.00'}</span>
                      <span className="stat-label">Total Owed</span>
                    </div>
                  </div>
                  
                  <div className={`net-balance ${member.netBalance >= 0 ? 'positive' : 'negative'}`}>
                    <span className="balance-label">
                      {member.netBalance >= 0 ? 'Owed' : 'Owes'}
                    </span>
                    <span className="balance-amount">
                      ${Math.abs(member.netBalance || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {member.netBalance !== 0 && !member.isCurrentUser && (
                    <button 
                      className="settle-btn"
                      onClick={() => settleBalance(member.id)}
                    >
                      {member.netBalance > 0 ? 'Mark as Paid' : 'Settle Up'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="members-section">
          <div className="section-header">
            <h2>Group Members</h2>
            <div className="expense-stats">
              <div className="stat">
                <span className="stat-value">{groupData.members?.length || 0}</span>
                <span className="stat-label">Total Members</span>
              </div>
              <div className="stat">
                <span className="stat-value">{groupData.inviteCode}</span>
                <span className="stat-label">Invite Code</span>
              </div>
            </div>
          </div>
          
          <div className="members-grid">
            {groupData.members?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No members yet</h3>
                <p>Invite friends and family to join this group</p>
              </div>
            ) : (
              groupData.members?.map(member => (
                <div key={member.id || member._id} className="member-card">
                  <div className="member-header">
                    <div className="member-avatar-large">
                      {member.picture ? (
                        <img 
                          src={member.picture} 
                          alt={member.name || 'Member'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <span>
                          {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="member-basic-info">
                      <h3>{member.name || member.email || 'Unknown User'}</h3>
                      <p className="member-email">{member.email || ''}</p>
                      <span className={`member-role-badge ${member.isOwner ? 'owner' : 'member'}`}>
                        {member.isOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="member-stats">
                    <div className="member-stat">
                      <span className="member-stat-value">${(member.totalPaid || 0).toFixed(2)}</span>
                      <span className="member-stat-label">Paid</span>
                    </div>
                    <div className="member-stat">
                      <span className="member-stat-value">${(member.totalOwed || 0).toFixed(2)}</span>
                      <span className="member-stat-label">Owes</span>
                    </div>
                  </div>
                  
                  <div className={`member-balance ${
                    (member.netBalance || 0) > 0 ? 'positive' : 
                    (member.netBalance || 0) < 0 ? 'negative' : 'neutral'
                  }`}>
                    <span className="member-balance-label">Net Balance</span>
                    <span className="member-balance-amount">
                      ${Math.abs(member.netBalance || 0).toFixed(2)}
                      {(member.netBalance || 0) > 0 && ' (owed)'}
                      {(member.netBalance || 0) < 0 && ' (owes)'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="summary-section">
          <h2>Group Summary</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Expense Breakdown</h3>
              <div className="category-breakdown">
                {groupData.categoryTotals?.map(category => (
                  <div key={category.name} className="category-item">
                    <div className="category-info">
                      <span className="category-name">{category.name}</span>
                      <span className="category-amount">${category.total.toFixed(2)}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${(category.total / groupData.totalExpenses) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="summary-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {groupData.recentActivity?.slice(0, 5).map(activity => (
                  <div key={activity._id || activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getExpenseTypeIcon(activity.type)}
                    </div>
                    <div className="activity-details">
                      <p>{activity.description}</p>
                      <span className="activity-meta">
                        {activity.payer.name} • {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="activity-amount">
                      ${activity.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDashboard;
