// src/pages/AdminVIEW/AdminOPDDashboard.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardNavigation from "../../components/navigation/DashboardNavigation";
import "../Dashboard.css";
import ViewRecordComponent from "../../components/modals/ViewRecordComponent";

// Import table components
import OPDPsychologicalRecordsGCO from "../../components/tables/dashboard-tables/OPDPsychologicalRecordsGCO";
import OPDMedicalRecordsINF from "../../components/tables/dashboard-tables/OPDMedicalRecordsINF";
import OPDPsychologicalRecordsINF from "../../components/tables/dashboard-tables/OPDPsychologicalRecordsINF";
import AnalyticsReport from '../../components/analytics/AnalyticsReport';
import TallyAnalytics from '../../components/analytics/TallyAnalytics';
import AddButton from '../../components/buttons/AddButton';

const AdminOPDDashboard = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
  const location = useLocation();
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Administrator';
  const type = userData?.type || localStorage.getItem('type') || 'Administrator';
  
  // Force viewType to be OPD for this admin view
  const viewType = "OPD";

  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const [activeTab, setActiveTab] = useState(0);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Use OPD styling for admin OPD dashboard
  const getOfficeClass = () => "office-records-opd";

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

  // Define tabs and components for Admin OPD Dashboard
  const getTabsConfig = () => {
    return {
      tabs: [
        "Psychological Records (GCO)",
        "Medical Records (INF)",
        "Psychological Records (INF)"
      ],
      components: [
        <OPDPsychologicalRecordsGCO
          key="psych-gco"
          userType={viewType}
          onRowClick={handleRowClick}
        />,
        <OPDMedicalRecordsINF
          key="medical-inf"
          userType={viewType}
          onRowClick={handleRowClick}
        />,
        <OPDPsychologicalRecordsINF
          key="psych-inf"
          userType={viewType}
          onRowClick={handleRowClick}
        />
      ]
    };
  };

  const { tabs, components } = getTabsConfig();

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
            {/* Tally Analytics Section for OPD */}
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
                    <span className="admin-badge">Admin View - OPD Office</span>
                  </div>
                  <AddButton
                    onClick={handleOpenGuide}
                    label="User Guide"
                    title="Open User Guide"
                 
                    style={{ backgroundColor: '#0a1a3c' }}
                  />
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs-navigation">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    className={`tab-button ${activeTab === index ? 'active' : ''}`}
                    onClick={() => setActiveTab(index)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {components[activeTab]}
              </div>
            </div>
          </div>

          {/* Right Section - 20% */}
          <div className="dashboard-right">
            {/* Analytics Report for OPD */}
            <div className="sidebar-card">
              <h3>Analytics Report</h3>
              <AnalyticsReport userType={viewType} />
            </div>
            
            {/* Admin Information Card */}
            <div className="sidebar-card">
              <h3>Admin Information</h3>
              <div className="admin-info">
                <p><strong>View Mode:</strong> Read-Only</p>
                <p><strong>Office:</strong> OPD (Office of the Prefect of Discipline)</p>
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
        onEdit={() => {}}
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

export default AdminOPDDashboard;