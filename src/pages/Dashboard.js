// Dashboard.js - Updated to handle view modal
import React, { useState } from 'react';
import DashboardNavigation from "../components/navigation/DashboardNavigation";
import "./Dashboard.css";
import ViewRecordComponent from "../components/modals/ViewRecordComponent"; // Add this import
import DemoOverlay from './DemoOverlay';

// Import table components (same as before)
import OPDPsychologicalRecordsGCO from "../components/tables/dashboard-tables/OPDPsychologicalRecordsGCO";
import OPDMedicalRecordsINF from "../components/tables/dashboard-tables/OPDMedicalRecordsINF";
import OPDPsychologicalRecordsINF from "../components/tables/dashboard-tables/OPDPsychologicalRecordsINF";
import GCOCounselingRecords from "../components/tables/dashboard-tables/GCOCounselingRecords";
import INFPsychologicalRecordsGCO from "../components/tables/dashboard-tables/INFPsychologicalRecordsGCO";
import AnalyticsReport from '../components/analytics/AnalyticsReport';
import TallyAnalytics from '../components/analytics/TallyAnalytics';
import QuickActions from '../components/quick-actions/QuickActions';

const Dashboard = ({ userData, onLogout, onNavItemClick }) => {
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Unknown Department';
  const type = userData?.type || localStorage.getItem('type') || 'Unknown Type';
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const [activeTab, setActiveTab] = useState(0);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  // Function to handle edit (you can implement this later)
  const handleEditRecord = (record) => {
    console.log('Edit record:', record);
    // You can implement edit functionality here
  };

  // Define tabs and components based on user type - Updated to pass handleRowClick
  const getTabsConfig = () => {
    switch (type) {
      case "OPD":
        return {
          tabs: [
            "Psychological Records (GCO)",
            "Medical Records (INF)",
            "Psychological Records (INF)"
          ],
          components: [
            <OPDPsychologicalRecordsGCO 
              key="psych-gco" 
              userType={type} 
              onRowClick={handleRowClick}
            />,
            <OPDMedicalRecordsINF 
              key="medical-inf" 
              userType={type} 
              onRowClick={handleRowClick}
            />,
            <OPDPsychologicalRecordsINF 
              key="psych-inf" 
              userType={type} 
              onRowClick={handleRowClick}
            />
          ]
        };
      case "GCO":
        return {
          tabs: ["Counseling Records"],
          components: [
            <GCOCounselingRecords 
              key="counseling" 
              userType={type} 
              onRowClick={handleRowClick}
            />
          ]
        };
      case "INF":
        return {
          tabs: [
            "Medical Records (INF)",
            "Psychological Records (GCO)"
          ],
          components: [
            <OPDMedicalRecordsINF 
              key="medical-inf" 
              userType={type} 
              onRowClick={handleRowClick}
            />,
            <INFPsychologicalRecordsGCO 
              key="psych-gco" 
              userType={type} 
              onRowClick={handleRowClick}
            />
          ]
        };
      default:
        return {
          tabs: ["Records"],
          components: [<div key="default">Default Table Component</div>]
        };
    }
  };

  const { tabs, components } = getTabsConfig();

  // Rest of the component remains the same...
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
    <div className="dashboard-container">
      {/* <DemoOverlay /> */}
      {/* Header/Nav Bar */}
      <DashboardNavigation 
        userName={name} 
        userType={type}
        userDepartment={department}
        onLogout={onLogout}
        onNavItemClick={onNavItemClick}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Left Section - 80% */}
          <div className="dashboard-left">
            {/* Tally Analytics Section */}
            <TallyAnalytics userType={type} />

            {/* Dashboard Tables Section */}
            <div className="dashboard-tables">
              {/* Date and Guide Button */}
              <div className="date-guide-container">
                <div className="current-date">
                  {getCurrentDate()}
                </div>
                <button 
                  className="guide-button"
                  onClick={handleOpenGuide}
                  title="Open User Guide"
                >
                  User Guide
                </button>
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
            {/* Quick Actions - Only shown for GCO users */}
            <QuickActions userType={type} />
            
            <div className="sidebar-card">
              <h3>Analytics Report</h3>
              <AnalyticsReport userType={type} />
            </div>
          </div>
        </div>
      </main>

      {/* View Record Modal */}
      <ViewRecordComponent
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        record={selectedRecord}
        type={type}
        onEdit={handleEditRecord}
      />
    </div>
  );
};

export default Dashboard;