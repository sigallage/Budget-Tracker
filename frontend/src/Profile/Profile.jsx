import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currencyPreference: 'USD',
    notificationPreferences: {
      email: true,
      push: true
    }
  });
  const [avatar, setAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProfileData(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          currencyPreference: response.data.currencyPreference || 'USD',
          notificationPreferences: response.data.notificationPreferences || {
            email: true,
            push: true
          }
        });
        setPreviewAvatar(response.data.picture || '');
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user, getAccessTokenSilently]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('notificationPreferences')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [prefKey]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const formDataToSend = new FormData();
      
      // Append regular fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('currencyPreference', formData.currencyPreference);
      formDataToSend.append('notificationPreferences', JSON.stringify(formData.notificationPreferences));
      
      // Append avatar if changed
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }

      const response = await axios.put('/api/profile', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfileData(response.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
        {!editMode && (
          <button 
            className="edit-button"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <img 
              src={previewAvatar || '/default-avatar.png'} 
              alt="Profile" 
              className="profile-avatar"
            />
            {editMode && (
              <div className="avatar-upload">
                <label htmlFor="avatar-upload" className="upload-button">
                  Change Photo
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="currencyPreference">Currency Preference</label>
              <select
                id="currencyPreference"
                name="currencyPreference"
                value={formData.currencyPreference}
                onChange={handleInputChange}
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="INR">Indian Rupee (INR)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notification Preferences</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notificationPreferences.email"
                    checked={formData.notificationPreferences.email}
                    onChange={handleInputChange}
                  />
                  Email Notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="notificationPreferences.push"
                    checked={formData.notificationPreferences.push}
                    onChange={handleInputChange}
                  />
                  Push Notifications
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone || '',
                    currencyPreference: profileData.currencyPreference || 'USD',
                    notificationPreferences: profileData.notificationPreferences || {
                      email: true,
                      push: true
                    }
                  });
                  setPreviewAvatar(profileData.picture || '');
                  setAvatar(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{profileData.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{profileData.email}</span>
            </div>
            {profileData.phone && (
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{profileData.phone}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Currency:</span>
              <span className="detail-value">
                {profileData.currencyPreference || 'USD'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Notifications:</span>
              <span className="detail-value">
                {profileData.notificationPreferences?.email ? 'Email' : ''}
                {profileData.notificationPreferences?.email && 
                 profileData.notificationPreferences?.push ? ', ' : ''}
                {profileData.notificationPreferences?.push ? 'Push' : ''}
                {!profileData.notificationPreferences?.email && 
                 !profileData.notificationPreferences?.push ? 'None' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;