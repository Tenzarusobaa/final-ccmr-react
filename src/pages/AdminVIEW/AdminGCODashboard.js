// src/pages/AdminVIEW/AdminGCODashboard.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardNavigation from "../../components/navigation/DashboardNavigation";
import "../Dashboard.css";
import ViewRecordComponent from "../../components/modals/ViewRecordComponent";

// Import table components
import GCOCounselingRecords from "../../components/tables/dashboard-tables/GCOCounselingRecords";
import AnalyticsReport from '../../components/analytics/AnalyticsReport';
import TallyAnalytics from '../../components/analytics/TallyAnalytics';
import QuickActions from '../../components/quick-actions/QuickActions';
import AddButton from '../../components/buttons/AddButton';

const AdminGCODashboard = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
  const location = useLocation();
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Administrator';
  const type = userData?.type || localStorage.getItem('type') || 'Administrator';

  // Force viewType to be GCO for this admin view
  const viewType = "GCO";

  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Use GCO styling for admin GCO dashboard
  const getOfficeClass = () => "office-records-gco";

  // Function to handle row click
  const handleRowClick = (record, recordType) => {
    setSelectedRecord({ ...record, recordType });
    setViewModalOpen(true);
  };

  // Function to close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedRecord(null);
  };

  // Handle exit view as for Administrator
  const handleExitViewAs = () => {
    if (onExitViewAs) {
      onExitViewAs();
    }
  };

  const handleOpenGuide = () => {
    window.open('https://docs.google.com/document/d/1FGG963aQ50fCjSXzJR-1mOuzW7FldZCS/edit?usp=sharing&ouid=108651438848254952190&rtpof=true&sd=true', '_blank');
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

  return (
    <div className={`dashboard-container ${getOfficeClass()}`}>
      {/* Header/Nav Bar */}
      <DashboardNavigation
        userName={name}
        userType={type}
        userDepartment={department}
        onLogout={onLogout}
        onExitViewAs={handleExitViewAs}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Left Section - 80% */}
          <div className="dashboard-left">
            {/* Tally Analytics Section for GCO */}
            <TallyAnalytics userType={viewType} isAdmin={true} />

            {/* Dashboard Tables Section */}
            <div className="dashboard-tables">
              {/* Date and Guide Button */}
              <div className="date-guide-container">
                <div className="current-date">
                  {getCurrentDate()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="admin-view-indicator">
                    <span className="admin-badge">Admin View - GCO Office</span>
                  </div>
                  <AddButton
                    onClick={handleOpenGuide}
                    label="User Guide"
                    title="Open User Guide"
           
                    style={{ backgroundColor: '#0a1a3c' }}
                  />
                </div>
              </div>

              {/* Counseling Records Table */}
              <div className="dashboard-table-section">
                <h3>Counseling Records</h3>
                <GCOCounselingRecords
                  userType={viewType}
                  onRowClick={handleRowClick}
                  isAdmin={true}
                />
              </div>
            </div>
          </div>

          {/* Right Section - 20% */}
          <div className="dashboard-right">
            {/* Quick Actions for Admin GCO */}
            <div className="sidebar-card">
              <h3>Quick Actions</h3>
              <QuickActions userType={viewType} isAdmin={true} /> {/* Add isAdmin prop */}
            </div>

            {/* Analytics Report for GCO */}
            <div className="sidebar-card">
              <h3>Analytics Report</h3>
              <AnalyticsReport userType={viewType} />
            </div>

            {/* Admin Information Card */}
            <div className="sidebar-card">
              <h3>Admin Information</h3>
              <div className="admin-info">
                <p><strong>View Mode:</strong> Read-Only</p>
                <p><strong>Office:</strong> GCO (Guidance Counseling Office)</p>
                <p><strong>Access Level:</strong> Administrator View</p>
                <p className="admin-note">
                  <em>Note: As an administrator, you can view all records but cannot add, edit, or delete data in this view.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* View Record Modal */}
      <ViewRecordComponent
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        record={selectedRecord}
        type={viewType}
        onEdit={() => { }}
      />
      <div className="footer">
        <div className="footer-header"> DATA PRIVACY CLOSURE</div>
        <div className="footer-text">
          To the extent permitted or required by law, we share, disclose, or transfer the information mentioned above with the permission of the data subjects to specific entities, organizations, or offices such as the Guidance and Counselling Office, the Office of the Prefect of Discipline, the Physical Education Department, and the Head Moderator. This is for the purpose of determining eligibility in academic competitions, eligibility in sports, exemptions from strenuous activities, as well as other similar events. All information provided is confidential and shall not be copied, shared, distributed, and used for any other purposes. We will use the collected data solely for our legitimate purposes and for the proper handling of records.
        </div>
      </div>
    </div>
  );
};

export default AdminGCODashboard;