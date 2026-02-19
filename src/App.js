// src/App.js - Updated with all Admin View routes including INF records
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OPDRecords from './pages/OPDRecords';
import GCORecords from './pages/GCORecords';
import INFRecords from './pages/INFRecords';
import StudentData from './pages/StudentData';
import AdministratorDashboard from './pages/AdministratorDashboard';
import MedicalCertificates from './pages/MedicalCertificates';


// Import Admin View Dashboard pages
import AdminOPDDashboard from './pages/AdminVIEW/AdminOPDDashboard';
import AdminGCODashboard from './pages/AdminVIEW/AdminGCODashboard';
import AdminINFDashboard from './pages/AdminVIEW/AdminINFDashboard';

// Import Admin View OPD Records pages
import AdminOPDRecords from './pages/AdminVIEW/AdminOPDRecords';
import AdminOPDRecordsGCO from './pages/AdminVIEW/AdminOPDRecordsGCO';

// Import Admin View GCO Records pages
import AdminGCORecords from './pages/AdminVIEW/AdminGCORecords';
import AdminGCORecordsOPD from './pages/AdminVIEW/AdminGCORecordsOPD';
import AdminGCORecordsINF from './pages/AdminVIEW/AdminGCORecordsINF';

// Import Admin View INF Records pages
import AdminINFRecords from './pages/AdminVIEW/AdminINFRecords';
import AdminINFRecordsOPD from './pages/AdminVIEW/AdminINFRecordsOPD';
import AdminINFRecordsGCO from './pages/AdminVIEW/AdminINFRecordsGCO';

// Import Admin View Student Data pages
import AdminStudentData from './pages/AdminVIEW/AdminStudentData';

import './App.css';

// Main app content component that uses router
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userType = localStorage.getItem('userType');
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      const userDepartment = localStorage.getItem('userDepartment');

      if (token && userType && userEmail && userName) {
        const userData = {
          token: token,
          type: userType,
          email: userEmail,
          name: userName,
          department: userDepartment
        };
        setUserData(userData);
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (userData) => {
    setUserData(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Clear all auth data including viewType
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userDepartment');
    localStorage.removeItem('viewType');

    setUserData(null);
    setIsLoggedIn(false);
  };

  // Function to exit view as mode - called from child components
  const handleExitViewAs = () => {
    // Clear viewType from localStorage when exiting
    localStorage.removeItem('viewType');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <Routes>
          {/* Administrator dashboard - only accessible when user is Administrator */}
          {userData?.type === "Administrator" && (
            <Route path="/administrator" element={
              <AdministratorDashboard
                userData={userData}
                onLogout={handleLogout}
              />
            } />
          )}

          {/* Main dashboard - handles both regular users and admin viewing as office */}
          <Route path="/dashboard" element={
            <Dashboard
              userData={userData}
              onLogout={handleLogout}
              onExitViewAs={handleExitViewAs}
            />
          } />

          {/* Office records pages - for regular users */}
          <Route path="/opd-records" element={
            <OPDRecords
              userData={userData}
              onLogout={handleLogout}
              onExitViewAs={handleExitViewAs}
            />
          } />
          <Route path="/gco-records" element={
            <GCORecords
              userData={userData}
              onLogout={handleLogout}
              onExitViewAs={handleExitViewAs}
            />
          } />
          <Route path="/inf-records" element={
            <INFRecords
              userData={userData}
              onLogout={handleLogout}
              onExitViewAs={handleExitViewAs}
            />
          } />
          <Route path="/student-data" element={
            <StudentData
              userData={userData}
              onLogout={handleLogout}
              onExitViewAs={handleExitViewAs}
            />
          } />

          <Route path="/medical-certificates" element={
            <MedicalCertificates
              userData={userData}
              onLogout={handleLogout}
              onExitViewAs={handleExitViewAs}
            />
          } />

          {/* ===== ADMIN VIEW PAGES - for Administrator users to view office data ===== */}
          {userData?.type === "Administrator" && (
            <>
              {/* Admin Dashboard Views */}
              <Route path="/admin-opd-dashboard" element={
                <AdminOPDDashboard
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-gco-dashboard" element={
                <AdminGCODashboard
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-inf-dashboard" element={
                <AdminINFDashboard
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />

              {/* Admin OPD Records Views */}
              <Route path="/admin-opd-records" element={
                <AdminOPDRecords
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-opd-records-gco" element={
                <AdminOPDRecordsGCO
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />

              {/* Admin GCO Records Views */}
              <Route path="/admin-gco-records" element={
                <AdminGCORecords
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-gco-records-opd" element={
                <AdminGCORecordsOPD
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-gco-records-inf" element={
                <AdminGCORecordsINF
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />

              {/* Admin INF Records Views */}
              <Route path="/admin-inf-records" element={
                <AdminINFRecords
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-inf-records-opd" element={
                <AdminINFRecordsOPD
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
              <Route path="/admin-inf-records-gco" element={
                <AdminINFRecordsGCO
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />

              {/* Admin Student Data Views */}
              <Route path="/admin-student-data" element={
                <AdminStudentData
                  userData={userData}
                  onLogout={handleLogout}
                  onExitViewAs={handleExitViewAs}
                />
              } />
            </>
          )}

          {/* Redirect root based on user type */}
          <Route path="/" element={
            userData?.type === "Administrator" ?
              <Navigate to="/administrator" replace /> :
              <Navigate to="/dashboard" replace />
          } />

          {/* Catch all route - redirect appropriately */}
          <Route path="*" element={
            userData?.type === "Administrator" ?
              <Navigate to="/administrator" replace /> :
              <Navigate to="/dashboard" replace />
          } />
        </Routes>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

// Main App component with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;