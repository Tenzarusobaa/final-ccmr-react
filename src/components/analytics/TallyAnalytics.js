// TallyAnalytics.js - Updated to handle admin mode

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './TallyAnalytics.css';

// Get base URL from environment variables
const baseUrl = process.env.REACT_APP_NODE_SERVER_URL || "https://ccmr-final-node-production.up.railway.app/";
const apiUrl = `${baseUrl}api`;

const TallyAnalytics = ({ userType, isAdmin = false }) => {
  const navigate = useNavigate();
  
  // State for OPD/INF analytics
  const [opdData, setOpdData] = useState({
    minor: 0,
    major: 0,
    serious: 0,
    total: 0
  });

  // State for GCO analytics
  const [gcoData, setGcoData] = useState({
    scheduled: 0,
    to_schedule: 0,
    done: 0,
    total: 0
  });

  // State for INF analytics
  const [infData, setInfData] = useState({
    medical: 0,
    psychological: 0,
    total: 0
  });

  useEffect(() => {
    // Fetch OPD/INF analytics for OPD users
    if (userType === "OPD") {
      axios.get(`${apiUrl}/analytics`)
        .then(res => {
          console.log("OPD analytics response:", res.data);

          // Handle array, nulls, or string-number issues
          const data = Array.isArray(res.data) ? res.data[0] : res.data || {};

          const minor = Number(data.minor || data.Minor || 0);
          const major = Number(data.major || data.Major || 0);
          const serious = Number(data.serious || data.Serious || 0);
          const total = minor + major + serious;

          setOpdData({
            minor,
            major,
            serious,
            total
          });
        })
        .catch(err => console.error("Error fetching OPD analytics:", err));
    }

    // Fetch GCO analytics for GCO users
    if (userType === "GCO") {
      axios.get(`${apiUrl}/gco-analytics`)
        .then(res => {
          console.log("GCO analytics response:", res.data);

          const data = Array.isArray(res.data) ? res.data[0] : res.data || {};

          const scheduled = Number(data.scheduled || data.Scheduled || 0);
          const to_schedule = Number(data.to_schedule || data["to_schedule"] || 0);
          const done = Number(data.done || data.Done || 0);
          const total = scheduled + to_schedule + done;

          setGcoData({
            scheduled,
            to_schedule,
            done,
            total
          });
        })
        .catch(err => console.error("Error fetching GCO analytics:", err));
    }

    // Fetch INF analytics for INF users
    if (userType === "INF") {
      axios.get(`${apiUrl}/inf-analytics`)
        .then(res => {
          console.log("INF analytics response:", res.data);

          const data = Array.isArray(res.data) ? res.data[0] : res.data || {};

          const medical = Number(data.medical || data.Medical || 0);
          const psychological = Number(data.psychological || data.Psychological || 0);
          const total = medical + psychological;

          setInfData({
            medical,
            psychological,
            total
          });
        })
        .catch(err => console.error("Error fetching INF analytics:", err));
    }
  }, [userType]);

  // Define colors based on user type and admin mode
  const getTallyColors = (index) => {
    // ADMIN COLORS - Force admin theme if isAdmin is true
    if (isAdmin) {
      const adminColors = [
        // First box - admin primary color
        { background: 'linear-gradient(90deg, #0a1a3c, #142f64)', color: 'white' },
        // Subsequent boxes - white with admin border
        { 
          background: '#ffffff', 
          color: '#495057',
          border: '2px solid #0a1a3c'
        },
        { 
          background: '#ffffff', 
          color: '#495057',
          border: '2px solid #0a1a3c'
        },
        { 
          background: '#ffffff', 
          color: '#495057',
          border: '2px solid #0a1a3c'
        }
      ];
      return adminColors[index] || adminColors[0];
    }

    // REGULAR OFFICE COLORS
    const primaryColors = {
      OPD: { background: 'linear-gradient(90deg, #003A6C, #004a8c)', color: 'white' },
      GCO: { background: 'linear-gradient(90deg, #00451D, #00652d)', color: 'white' },
      INF: { background: 'linear-gradient(90deg, #640C17, #841c27)', color: 'white' }
    };

    // First child gets primary color, others get white background with office border
    if (index === 0) {
      return primaryColors[userType] || { background: 'linear-gradient(90deg, #0a1a3c, #142f64)', color: 'white' };
    } else {
      // For subsequent boxes, use white with border matching the primary color
      const primaryColor = primaryColors[userType]?.background || 'linear-gradient(90deg, #0a1a3c, #142f64)';
      // Extract a solid color from gradient or use fallback
      let borderColor = '#e9ecef';
      if (userType === 'OPD') borderColor = '#003A6C';
      else if (userType === 'GCO') borderColor = '#00451D';
      else if (userType === 'INF') borderColor = '#640C17';
      else borderColor = '#0a1a3c';
      
      return { 
        background: '#ffffff', 
        color: '#495057',
        border: `2px solid ${borderColor}`
      };
    }
  };

  // Handle OPD tally click
  const handleOPDTallyClick = (filterType) => {
    console.log(`Navigating to OPDRecords with filter: ${filterType}`);
    
    // Pass the filter as state in navigation
    navigate('/opd-records', {
      state: {
        filter: filterType
      }
    });
  };

  // Handle GCO tally click
  const handleGCOTallyClick = (filterType) => {
    console.log(`Navigating to GCORecords with filter: ${filterType}`);
    
    navigate('/gco-records', {
      state: {
        filter: filterType
      }
    });
  };

  // Handle INF tally click
  const handleINFTallyClick = (filterType) => {
    console.log(`Navigating to INFRecords with filter: ${filterType}`);
    
    navigate('/inf-records', {
      state: {
        filter: filterType
      }
    });
  };

  // Handle navigation to records page without filter (for total boxes)
  const handleNavigateToRecords = () => {
    if (userType === "OPD") {
      navigate('/opd-records');
    } else if (userType === "GCO") {
      navigate('/gco-records');
    } else if (userType === "INF") {
      navigate('/inf-records');
    }
  };

  // OPD Tally Boxes - Total box is non-clickable
  const renderOPDTallies = () => (
    <>
      <div 
        className="tally-box" 
        style={getTallyColors(0)}
        onClick={isAdmin ? undefined : handleNavigateToRecords}
        title={isAdmin ? "Admin View - No navigation" : "View all cases"}
      >
        <div className="tally-title">Total Cases</div>
        <div className="tally-value">{opdData.total}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(1)}
        onClick={isAdmin ? undefined : () => handleOPDTallyClick('MINOR')}
        title={isAdmin ? "Admin View - No navigation" : "View only minor offenses"}
      >
        <div className="tally-title">Minor Offenses</div>
        <div className="tally-value">{opdData.minor}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(2)}
        onClick={isAdmin ? undefined : () => handleOPDTallyClick('MAJOR')}
        title={isAdmin ? "Admin View - No navigation" : "View only major offenses"}
      >
        <div className="tally-title">Major Offenses</div>
        <div className="tally-value">{opdData.major}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(3)}
        onClick={isAdmin ? undefined : () => handleOPDTallyClick('SERIOUS')}
        title={isAdmin ? "Admin View - No navigation" : "View only serious offenses"}
      >
        <div className="tally-title">Serious Offenses</div>
        <div className="tally-value">{opdData.serious}</div>
      </div>
    </>
  );

  // GCO Tally Boxes - Total box is non-clickable
  const renderGCOTallies = () => (
    <>
      <div 
        className="tally-box" 
        style={getTallyColors(0)}
        onClick={isAdmin ? undefined : handleNavigateToRecords}
        title={isAdmin ? "Admin View - No navigation" : "View all counseling sessions"}
      >
        <div className="tally-title">Total Counseling</div>
        <div className="tally-value">{gcoData.total}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(1)}
        onClick={isAdmin ? undefined : () => handleGCOTallyClick('TO_SCHEDULE')}
        title={isAdmin ? "Admin View - No navigation" : "View only sessions to schedule"}
      >
        <div className="tally-title">To Schedule</div>
        <div className="tally-value">{gcoData.to_schedule}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(2)}
        onClick={isAdmin ? undefined : () => handleGCOTallyClick('SCHEDULED')}
        title={isAdmin ? "Admin View - No navigation" : "View only scheduled sessions"}
      >
        <div className="tally-title">Scheduled</div>
        <div className="tally-value">{gcoData.scheduled}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(3)}
        onClick={isAdmin ? undefined : () => handleGCOTallyClick('DONE')}
        title={isAdmin ? "Admin View - No navigation" : "View only completed sessions"}
      >
        <div className="tally-title">Done</div>
        <div className="tally-value">{gcoData.done}</div>
      </div>
    </>
  );

  // INF Tally Boxes - Total box is non-clickable
  const renderINFTallies = () => (
    <>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(0)}
        onClick={isAdmin ? undefined : () => handleINFTallyClick('MEDICAL')}
        title={isAdmin ? "Admin View - No navigation" : "View only medical records"}
      >
        <div className="tally-title">Medical Condition</div>
        <div className="tally-value">{infData.medical}</div>
      </div>
      <div 
        className={`tally-box ${isAdmin ? '' : 'clickable'}`} 
        style={getTallyColors(1)}
        onClick={isAdmin ? undefined : () => handleINFTallyClick('PSYCHOLOGICAL')}
        title={isAdmin ? "Admin View - No navigation" : "View only psychological records"}
      >
        <div className="tally-title">Psychological Condition</div>
        <div className="tally-value">{infData.psychological}</div>
      </div>
      <div 
        className="tally-box" 
        style={getTallyColors(2)}
        onClick={isAdmin ? undefined : handleNavigateToRecords}
        title={isAdmin ? "Admin View - No navigation" : "View all records"}
      >
        <div className="tally-title">Total Records</div>
        <div className="tally-value">{infData.total}</div>
      </div>
    </>
  );

  return (
    <div className="tally-analytics-container">
      <div className="dashboard-tallies">
        {userType === "OPD" && renderOPDTallies()}
        {userType === "GCO" && renderGCOTallies()}
        {userType === "INF" && renderINFTallies()}
      </div>
    </div>
  );
};

export default TallyAnalytics;