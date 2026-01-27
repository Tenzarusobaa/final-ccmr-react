import React, { useState, useEffect } from 'react';
import './UserEditModal.css';

const UserEditModal = ({ isOpen, onClose, user, mode = 'view', onEdit, onDelete }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    office: '', // Changed from department to office
    userType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Office to Type mapping
  const officeToTypeMap = {
    'Office of the Prefect of Discipline': 'OPD',
    'Guidance Counseling Office': 'GCO',
    'Infirmary': 'INF',
    'Administrator': 'Administrator'
  };

  // Handle office change to automatically set user type
  const handleOfficeChange = (office) => {
    const newUserType = officeToTypeMap[office] || '';
    setFormData(prev => ({
      ...prev,
      office,
      userType: newUserType
    }));
    
    // Clear any existing type error
    if (errors.userType) {
      setErrors(prev => ({
        ...prev,
        userType: ''
      }));
    }
  };

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      // Map department to office for existing users
      const office = mapDepartmentToOffice(user.department);
      setFormData({
        email: user.email || '',
        username: user.username || '',
        name: user.name || '',
        office: office || '',
        userType: user.userType || ''
      });
    } else {
      setFormData({
        email: '',
        username: '',
        name: '',
        office: '',
        userType: ''
      });
    }
    setErrors({});
    setSuccessMessage('');
  }, [user, mode, isOpen]); // Added isOpen to dependencies

  // Helper function to map old department values to new office values
  const mapDepartmentToOffice = (department) => {
    const mapping = {
      'OPD': 'Office of the Prefect of Discipline',
      'GCO': 'Guidance Counseling Office',
      'INF': 'Infirmary',
      'Administrator': 'Administrator'
    };
    return mapping[department] || department;
  };

  // Helper function to map office values back to department for API
  const mapOfficeToDepartment = (office) => {
    const mapping = {
      'Office of the Prefect of Discipline': 'OPD',
      'Guidance Counseling Office': 'GCO',
      'Infirmary': 'INF',
      'Administrator': 'Administrator'
    };
    return mapping[office] || office;
  };

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'office') {
      handleOfficeChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    if (!formData.name) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.office) {
      newErrors.office = 'Office is required';
    }

    if (!formData.userType) {
      newErrors.userType = 'User type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const url = mode === 'add' 
        ? 'https://ccmr-final-node-production.up.railway.app/api/users'
        : `https://ccmr-final-node-production.up.railway.app/api/users/${user.email}`;

      const method = mode === 'add' ? 'POST' : 'PUT';

      // For API compatibility, map office back to department
      const submitData = { 
        ...formData,
        department: mapOfficeToDepartment(formData.office)
      };
      
      // Remove office field for API
      delete submitData.office;
      
      if (mode === 'add') {
        submitData.password = "google_oauth";
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(mode === 'add' ? 'User added successfully!' : 'Editing user...!');
        
        // Clear form if adding new user
        if (mode === 'add') {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setErrors({ submit: data.error || 'Operation failed' });
      }
    } catch (err) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (user && user.email) {
      onDelete(user.email);
    }
  };

  const modalTitle = mode === 'add' ? 'Add New User' : mode === 'edit' ? 'Edit User' : 'User Details';

  return (
    <div className="uem-overlay">
      <div className="uem-modal">
        <div className="uem-header">
          <h2>{modalTitle}</h2>
          <button className="uem-close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="uem-form">
          <div className="uem-sections-container">
            {/* Left Side: User Information */}
            <div className="uem-section uem-user-info">
              <h3>User Information</h3>
              
              <div className="uem-form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={errors.name ? 'uem-error' : ''}
                />
                {errors.name && <span className="uem-error-message">{errors.name}</span>}
              </div>

              <div className="uem-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={mode === 'view'} // Removed edit mode restriction
                  className={errors.email ? 'uem-error' : ''}
                />
                {errors.email && <span className="uem-error-message">{errors.email}</span>}
              </div>
            </div>

            {/* Right Side: Account Details */}
            <div className="uem-section uem-account-details">
              <h3>Account Details</h3>
              
              <div className="uem-form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={errors.username ? 'uem-error' : ''}
                />
                {errors.username && <span className="uem-error-message">{errors.username}</span>}
              </div>

              <div className="uem-form-group">
                <label htmlFor="office">Office *</label>
                <select
                  id="office"
                  name="office"
                  value={formData.office}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={errors.office ? 'uem-error' : ''}
                >
                  <option value="">Select Office</option>
                  <option value="Office of the Prefect of Discipline">Office of the Prefect of Discipline</option>
                  <option value="Guidance Counseling Office">Guidance Counseling Office</option>
                  <option value="Infirmary">Infirmary</option>
                  <option value="Administrator">Administrator</option>
                </select>
                {errors.office && <span className="uem-error-message">{errors.office}</span>}
              </div>

              <div className="uem-form-group">
                <label htmlFor="userType">User Type *</label>
                <input
                  type="text"
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  disabled
                  className="uem-readonly"
                />
                {errors.userType && <span className="uem-error-message">{errors.userType}</span>}
                <small className="uem-field-note">
                  Automatically determined by Office selection
                </small>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="uem-error-alert">
              {errors.submit}
            </div>
          )}

          {successMessage && (
            <div className="uem-success-alert">
              {successMessage}
            </div>
          )}

          <div className="uem-actions">
            {mode === 'view' ? (
              <>
                <button
                  type="button"
                  className="uem-btn-edit"
                  onClick={() => onEdit && onEdit()}
                >
                  Edit User
                </button>
                <button
                  type="button"
                  className="uem-btn-delete"
                  onClick={handleDelete}
                >
                  Delete User
                </button>
                <button
                  type="button"
                  className="uem-btn-cancel"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  className="uem-btn-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add User' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="uem-btn-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;