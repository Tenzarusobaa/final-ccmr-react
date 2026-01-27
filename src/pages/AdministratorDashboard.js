import React, { useState, useEffect } from 'react';
import DataTable from '../components/tables/DataTable';
import DashboardNavigation from "../components/navigation/DashboardNavigation";
import UserEditModal from '../components/modals/UserEditModal';
import "./Dashboard.css";
import AddButton from '../components/buttons/AddButton';

const AdministratorDashboard = ({ userData, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', or 'add'

  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const type = userData?.type || localStorage.getItem('userType') || 'Administrator';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Administrator';

  useEffect(() => {
    fetchUsers();
  }, []);

  const API_BASE = "https://ccmr-final-node-production.up.railway.app/api";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);

    const sortedUsers = [...users].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle dates
      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setUsers(sortedUsers);
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setModalMode('view');
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode('add');
    setShowUserModal(true);
  };

  const handleEditUser = () => {
    setModalMode('edit');
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    fetchUsers(); // Refresh user list
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to delete user ${email}?`)) {
      try {
        const response = await fetch(`${API_BASE}/users/${email}`, {
          method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
          alert('User deleted successfully');
          fetchUsers();
          handleCloseModal();
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      }
    }
  };

  const userColumns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'name', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'userType',
      label: 'User Type',
      sortable: true,
      render: (value) => (
        <span className={`user-type ${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
  ];

  const stats = {
    totalUsers: users.length,
    administrators: users.filter(u => u.userType === 'Administrator').length,
    departmentStaff: users.filter(u => u.department === 'OPD' || u.department === 'GCO' || u.department === 'INF').length
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleOpenGuide = () => {
    window.open('https://docs.google.com/document/d/1FGG963aQ50fCjSXzJR-1mOuzW7FldZCS/edit?usp=sharing&ouid=108651438848254952190&rtpof=true&sd=true', '_blank');
  };

  return (
    <div className="dashboard-container">
      {/* Header/Nav Bar */}
      <DashboardNavigation
        userName={name}
        userType={type}
        userDepartment={department}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Left Section - 100% for Administrator */}
          <div className="dashboard-left" style={{ flex: '0 0 100%', width: '100%' }}>
            {/* Administrator Dashboard Content */}
            <div className="dashboard-tables">
              {/* Date and Guide Button */}
              <div className="date-guide-container">
                <div className="current-date">
                  {getCurrentDate()}
                </div>
                <div className="header-buttons" style={{ display: 'flex' }}>
                  <AddButton
                    onClick={handleAddUser}
                    label="Add User"
                    type="default" 
                    title="Add New User"
                  />
                  <AddButton
                    onClick={handleOpenGuide}
                    label="User Guide"
                    title="Open User Guide"
                  />
                </div>
              </div>

              {/* User Management Section */}
              <div className="administrator-content">
                <div className="section-header">
                  <h2>User Management</h2>
                </div>

                {loading ? (
                  <div className="loading-spinner">Loading users...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : (
                  <DataTable
                    data={users}
                    columns={userColumns}
                    type="users"
                    onRowClick={handleRowClick}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* User Edit Modal */}
      {showUserModal && (
        <UserEditModal
          isOpen={showUserModal}
          onClose={handleCloseModal}
          user={selectedUser}
          mode={modalMode}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-header"> DATA PRIVACY CLOSURE</div>
        <div className="footer-text">
          To the extent permitted or required by law, we share, disclose, or transfer the information mentioned above with the permission of the data subjects to specific entities, organizations, or offices such as the Guidance and Counselling Office, the Office of the Prefect of Discipline, the Physical Education Department, and the Head Moderator. This is for the purpose of determining eligibility in academic competitions, eligibility in sports, exemptions from strenuous activities, as well as other similar events. All information provided is confidential and shall not be copied, shared, distributed, and used for any other purposes. We will use the collected data solely for our legitimate purposes and for the proper handling of records.
        </div>
      </div>
    </div>
  );
};

export default AdministratorDashboard;