import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get('/api/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            range: timeRange
          }
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, timeRange, getAccessTokenSilently]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome back, {dashboardData?.user.name || 'User'}</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
          <button 
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            This Year
          </button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'balances' ? 'active' : ''}
          onClick={() => setActiveTab('balances')}
        >
          Balances
        </button>
        <button 
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Recent Activity
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Spent</h3>
              <p className="amount">${dashboardData?.summary.totalSpent.toFixed(2)}</p>
              <p className="subtext">across all groups</p>
            </div>
            <div className="stat-card">
              <h3>You Owe</h3>
              <p className="amount negative">${dashboardData?.summary.youOwe.toFixed(2)}</p>
              <p className="subtext">to others</p>
            </div>
            <div className="stat-card">
              <h3>You're Owed</h3>
              <p className="amount positive">${dashboardData?.summary.owedToYou.toFixed(2)}</p>
              <p className="subtext">by others</p>
            </div>
            <div className="stat-card">
              <h3>Net Balance</h3>
              <p className={`amount ${
                dashboardData?.summary.netBalance >= 0 ? 'positive' : 'negative'
              }`}>
                ${dashboardData?.summary.netBalance.toFixed(2)}
              </p>
              <p className="subtext">
                {dashboardData?.summary.netBalance >= 0 ? 'You are owed' : 'You owe'}
              </p>
            </div>
          </div>

          <div className="spending-breakdown">
            <h2>Spending Breakdown</h2>
            <div className="categories-grid">
              {dashboardData?.categories.map(category => (
                <div key={category.name} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <span className="category-amount">${category.amount.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(category.amount / dashboardData.summary.totalSpent) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="balances-section">
          <h2>Your Balances</h2>
          <div className="balances-list">
            {dashboardData?.balances.map(balance => (
              <div key={balance.groupId} className="balance-card">
                <h3>{balance.groupName}</h3>
                <div className="balance-details">
                  {balance.members.map(member => (
                    <div key={member.userId} className="member-balance">
                      <div className="member-info">
                        <img 
                          src={member.avatar || '/default-avatar.png'} 
                          alt={member.name} 
                          className="avatar"
                        />
                        <span>{member.name}</span>
                      </div>
                      <span className={`amount ${
                        member.amount >= 0 ? 'positive' : 'negative'
                      }`}>
                        {member.amount >= 0 ? 'You owe ' : 'Owes you '}
                        ${Math.abs(member.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {dashboardData?.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-avatar">
                  <img 
                    src={activity.payer.avatar || '/default-avatar.png'} 
                    alt={activity.payer.name} 
                  />
                </div>
                <div className="activity-details">
                  <p className="activity-description">
                    <strong>{activity.payer.name}</strong> {activity.type === 'expense' ? 'paid' : 'settled'} ${activity.amount.toFixed(2)}
                    {activity.type === 'expense' && ` for ${activity.description}`}
                  </p>
                  <p className="activity-meta">
                    {new Date(activity.date).toLocaleDateString()} • {activity.groupName}
                  </p>
                </div>
                <div className={`activity-amount ${
                  activity.amount >= 0 ? 'positive' : 'negative'
                }`}>
                  ${activity.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;