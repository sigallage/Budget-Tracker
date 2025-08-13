import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Groups.css';

const Groups = () => {
  console.log('Groups component rendering');
  const { user, getAccessTokenSilently } = useAuth0();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'family' // family, friends, roommates, other
  });
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    console.log('Groups component mounted');
    fetchGroups(); // Re-enable API call
  }, []);

  const fetchGroups = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get('http://localhost:5000/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      // For development - set empty groups array so page still renders
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post('http://localhost:5000/api/groups', newGroup, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups([...groups, response.data]);
      setShowCreateForm(false);
      setNewGroup({ name: '', description: '', type: 'family' });
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Cannot create group - backend not connected. This is a demo interface.');
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post('http://localhost:5000/api/groups/join', 
        { inviteCode: joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups([...groups, response.data]);
      setShowJoinForm(false);
      setJoinCode('');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Cannot join group - backend not connected. This is a demo interface.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your groups...</p>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Your Groups</h1>
        <div className="groups-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Group
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowJoinForm(true)}
          >
            Join Group
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h2>No Groups Yet</h2>
          <p>Create a group to start tracking expenses with family or friends</p>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map(group => (
            <div key={group._id || group.id} className="group-card">
              <div className="group-header">
                <h3>{group.name}</h3>
                <span className={`group-type ${group.type}`}>
                  {group.type}
                </span>
              </div>
              <p className="group-description">{group.description}</p>
              <div className="group-stats">
                <div className="stat">
                  <span className="stat-value">{group.memberCount}</span>
                  <span className="stat-label">Members</span>
                </div>
                <div className="stat">
                  <span className="stat-value">${group.totalExpenses?.toFixed(2) || '0.00'}</span>
                  <span className="stat-label">Total Expenses</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{group.expenseCount || 0}</span>
                  <span className="stat-label">Expenses</span>
                </div>
              </div>
              <div className="group-actions">
                <Link 
                  to={`/groups/${group._id || group.id}`} 
                  className="btn-primary"
                >
                  View Group
                </Link>
                <Link 
                  to={`/groups/${group._id || group.id}/add-expense`} 
                  className="btn-secondary"
                >
                  Add Expense
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={createGroup} className="group-form">
              <div className="form-group">
                <label htmlFor="name">Group Name</label>
                <input
                  type="text"
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  required
                  placeholder="e.g., Family Budget, Trip to Paris"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="What is this group for?"
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Group Type</label>
                <select
                  id="type"
                  value={newGroup.type}
                  onChange={(e) => setNewGroup({...newGroup, type: e.target.value})}
                >
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                  <option value="roommates">Roommates</option>
                  <option value="trip">Trip</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Join Group</h2>
              <button 
                className="close-btn"
                onClick={() => setShowJoinForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={joinGroup} className="join-form">
              <div className="form-group">
                <label htmlFor="joinCode">Invite Code</label>
                <input
                  type="text"
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  placeholder="Enter the group invite code"
                />
                <small>Ask a group member for the invite code</small>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowJoinForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
