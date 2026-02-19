// INFPsychologicalRecordsGCO.js - Updated with admin styling support
import React, { useState, useEffect } from 'react';
import './DashboardTables.css';

const INFPsychologicalRecordsGCO = ({ userType = 'default', onRowClick, isAdmin = false }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPsychologicalRecords();
  }, []);

  const fetchPsychologicalRecords = async () => {
    try {
      const baseUrl = process.env.REACT_APP_NODE_SERVER_URL;
      const apiUrl = `${baseUrl}api/infirmary/counseling-records`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        // Filter for psychological records and limit to 10 most recent
        const psychologicalRecords = data.records
          .filter(record => record.psychologicalCondition === 'YES')
          .slice(0, 10);
        setRecords(psychologicalRecords);
      } else {
        setError('Failed to fetch records');
      }
    } catch (err) {
      setError('Error fetching psychological records');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle row click
  const handleRowClick = (record) => {
    if (onRowClick) {
      onRowClick(record, 'GCO');
    }
  };

  // Get the appropriate class based on admin mode
  const getContainerClass = () => {
    if (isAdmin) return 'dashboard-table-container admin';
    return `dashboard-table-container ${userType.toLowerCase()}`;
  };

  // Get header class for admin mode
  const getHeaderClass = () => {
    return isAdmin ? 'admin-header' : '';
  };

  if (loading) return <div className="table-loading">Loading psychological records...</div>;
  if (error) return <div className="table-error">Error: {error}</div>;

  return (
    <div className={getContainerClass()}>
      <h3 className={getHeaderClass()}>Psychological Records (GCO) - Recent 10</h3>
      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Record Number</th>
              <th>Name</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map(record => (
                <tr 
                  key={record.recordId}
                  className="clickable-row"
                  onClick={() => handleRowClick(record)}
                >
                  <td>{record.recordId}</td>
                  <td>{record.name}</td>
                  <td>{record.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">No psychological records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default INFPsychologicalRecordsGCO;