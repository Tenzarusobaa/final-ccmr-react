import React, { useState, useEffect } from 'react';
import './UserEditModal.css';

const UserEditModal = ({ 
  isOpen, 
  onClose, 
  user, 
  mode, 
  onEdit,
  onDeactivate,
  onActivate 
}) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    department: '',
    userType: '',
    password: '',
    status: ''
  });
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        userType: user.userType || '',
        password: '', // Don't populate password for security
        status: user.status || 'Active'
      });
    } else {
      // Reset form for new user
      setFormData({
        username: '',
        name: '',
        email: '',
        department: 'OPD',
        userType: 'Staff',
        password: '',
        status: 'Active'
      });
    }
    
    // Set editing mode based on prop
    setIsEditing(mode === 'edit');
    
    // Reset messages when modal opens/changes
    setError('');
    setSuccessMessage('');
    setIsSaving(false);
  }, [user, mode, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.username || !formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    // For new users, password is required
    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      let response;
      let data;

      if (user) {
        // Update existing user
        response = await fetch(`${API_BASE}/users/${user.email}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            name: formData.name,
            department: formData.department,
            userType: formData.userType,
            password: formData.password || undefined // Only send password if provided
          })
        });
        data = await response.json();
      } else {
        // Create new user
        response = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            username: formData.username,
            name: formData.name,
            department: formData.department,
            userType: formData.userType,
            password: formData.password
          })
        });
        data = await response.json();
      }

      if (data.success) {
        setSuccessMessage(user ? 'User updated successfully!' : 'User added successfully!');
        
        // Wait a moment to show success message, then close
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Operation failed');
        setIsSaving(false);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user');
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    if (onEdit) onEdit();
  };

  const handleCancel = () => {
    if (isEditing) {
      // If in edit mode, revert to view mode
      setIsEditing(false);
      // Reset form to original user data
      if (user) {
        setFormData({
          username: user.username || '',
          name: user.name || '',
          email: user.email || '',
          department: user.department || '',
          userType: user.userType || '',
          password: '',
          status: user.status || 'Active'
        });
      }
    } else {
      // If in view mode, close modal
      onClose();
    }
    setError('');
  };

  const handleDeactivate = () => {
    if (onDeactivate && user) {
      onDeactivate(user.email);
    }
  };

  const handleActivate = () => {
    if (onActivate && user) {
      onActivate(user.email);
    }
  };

  if (!isOpen) return null;

  const isNewUser = !user;
  const isViewMode = !isEditing && !isNewUser;
  const isActive = formData.status === 'Active';

  return (
    <div className="uem-overlay">
      <div className="uem-modal">
        <div className="uem-header">
          <h2>
            {isNewUser ? 'Add New User' : 
             isViewMode ? 'User Details' : 'Edit User'}
          </h2>
        </div>

        <div className="uem-form">
          {error && <div className="uem-error-alert">{error}</div>}
          {successMessage && <div className="uem-success-alert">{successMessage}</div>}

          <div className="uem-sections-container">
            {/* User Information Section */}
            <div className="uem-section uem-user-info">
              <h3>User Information</h3>
              
              <div className="uem-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isViewMode || isSaving}
                  required
                />
              </div>

              <div className="uem-form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isViewMode || isSaving}
                  required
                />
              </div>

              <div className="uem-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isViewMode || (user && !isNewUser) || isSaving} // Email can't be changed for existing users
                  required
                />
                {user && !isNewUser && (
                  <span className="uem-field-note">Email cannot be changed</span>
                )}
              </div>
            </div>

            {/* Account Details Section */}
            <div className="uem-section uem-account-details">
              <h3>Account Details</h3>

              <div className="uem-form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={isViewMode || isSaving}
                  required
                >
                  <option value="OPD">OPD</option>
                  <option value="GCO">GCO</option>
                  <option value="INF">INF</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div className="uem-form-group">
                <label>User Type *</label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  disabled={isViewMode || isSaving}
                  required
                >
                  <option value="Staff">Staff</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div className="uem-form-group">
                <label>{isNewUser ? 'Password *' : 'New Password (leave blank to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isViewMode || isSaving}
                  required={isNewUser}
                  placeholder={isNewUser ? 'Enter password' : 'Leave blank to keep current'}
                />
              </div>

              {!isNewUser && (
                <>
                  <div className="uem-form-group">
                    <label>Status</label>
                    <div className={`status-display ${isActive ? 'active' : 'inactive'}`}>
                      {formData.status}
                    </div>
                  </div>

                  {user?.createdAt && (
                    <div className="uem-form-group">
                      <label>Created Date</label>
                      <div className="date-display">
                        {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status-specific notes */}
          {!isNewUser && !isActive && (
            <div className="uem-note-section">
              <div className="uem-info-box">
                <strong>Note:</strong> This user is currently inactive. They cannot log in until activated.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="uem-actions">
            {isViewMode ? (
              // View mode buttons
              <>
                <button 
                  className="uem-btn-edit" 
                  onClick={handleEditClick}
                >
                  Edit User
                </button>
                {isActive ? (
                  <button 
                    className="uem-btn-deactivate" 
                    onClick={handleDeactivate}
                  >
                    Deactivate User
                  </button>
                ) : (
                  <button 
                    className="uem-btn-activate" 
                    onClick={handleActivate}
                  >
                    Activate User
                  </button>
                )}
                <button 
                  className="uem-btn-cancel" 
                  onClick={handleCancel}
                >
                  Close
                </button>
              </>
            ) : (
              // Edit or Add mode buttons
              <>
                <button 
                  className="uem-btn-save" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : (isNewUser ? 'Add User' : 'Save Changes')}
                </button>
                <button 
                  className="uem-btn-cancel" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;