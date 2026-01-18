// src/pages/GCORecords.js
import React, { useState, useEffect, useMemo } from 'react';
import NavBar from '../components/navigation/NavBar';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import Metrics from '../components/metrics/Metrics';
import SearchBar from '../components/search/SearchBar';
import AddButton from '../components/buttons/AddButton';
import DataTable from '../components/tables/DataTable';
import AddRecordComponent from '../components/modals/AddRecordComponent';
import ViewRecordComponent from '../components/modals/ViewRecordComponent';
import EditRecordComponent from '../components/modals/EditRecordComponent';
import { FaFolder, FaShieldAlt } from 'react-icons/fa';
import DemoOverlay from './DemoOverlay';
import './OfficeRecords.css';


const GCORecords = ({ userData, onLogout, onNavItemClick }) => {
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Unknown Department';
  const type = userData?.type || localStorage.getItem('type') || 'Unknown Type';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const getOfficeClass = () => {
    switch (type) {
      case "OPD": return "office-records-opd";
      case "GCO": return "office-records-gco";
      case "INF": return "office-records-inf";
      default: return "office-records-default";
    }
  };

  const getTitle = () => {
    if (type === "OPD") return "Counseling Records";
    if (type === "GCO") return "Counseling Records";
    if (type === "INF") return "Psychological Records";
    return "Counseling Records"; // default fallback
  };

  // Table columns configuration
  const counselingColumns = [
    { key: 'recordId', label: 'Record No.', sortable: true },
    { key: 'sessionNumber', label: 'Session', sortable: true },
    { key: 'id', label: 'ID No.', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { 
      key: 'status', 
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`status-badge status-${value?.toLowerCase() || 'unknown'}`}>
          {value}
        </span>
      )
    },
    { key: 'date', label: 'Date', sortable: true }
  ];

  // Sort records based on sortConfig
  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return records;

    return [...records].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // For numbers and dates
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [records, sortConfig]);

  // Handle sorting
  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  // Fetch records based on user type
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint;
      if (type === "INF") {
        // INF can only view psychological records
        endpoint = "https://ccmr-final-node-production.up.railway.app/api/infirmary/counseling-records";
      } else {
        // OPD and GCO can view all records
        endpoint = "https://ccmr-final-node-production.up.railway.app/api/counseling-records";
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
      } else {
        throw new Error(data.error || 'Failed to fetch records');
      }
    } catch (err) {
      console.error('Error fetching counseling records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      fetchRecords(); // Reset to all records if search is empty
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let endpoint;
      if (type === "INF") {
        // INF searches only in psychological records
        endpoint = `https://ccmr-final-node-production.up.railway.app/api/counseling-records/search?query=${encodeURIComponent(searchQuery)}`;
      } else {
        // OPD and GCO search in all records
        endpoint = `https://ccmr-final-node-production.up.railway.app/api/counseling-records/search?query=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // For INF, filter results to only show psychological records
        if (type === "INF") {
          const psychologicalRecords = data.records.filter(record => 
            record.psychologicalCondition === 'YES'
          );
          setRecords(psychologicalRecords);
        } else {
          setRecords(data.records || []);
        }
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching counseling records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh records data
  const refreshRecords = () => {
    fetchRecords();
  };

  useEffect(() => {
    fetchRecords();
  }, [type]); // Refetch when user type changes

  const handleAddRecord = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    refreshRecords(); // Refresh data after closing add modal
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedRecord(null);
    refreshRecords(); // Refresh data after closing view modal
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedRecord(null);
    refreshRecords(); // Refresh data after closing edit modal
  };

  const handleRecordAdded = (newRecord) => {
    setRecords(prevRecords => [newRecord, ...prevRecords]);
    setShowAddModal(false);
    refreshRecords(); // Refresh data after adding record
  };

  const handleRecordUpdated = (updatedRecord) => {
    setRecords(prevRecords => 
      prevRecords.map(record => 
        record.recordId === updatedRecord.recordId ? updatedRecord : record
      )
    );
    setShowEditModal(false);
    refreshRecords(); // Refresh data after updating record
  };

  const handleRowClick = (record) => {
    console.log('Record clicked:', record);
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`office-records-container ${getOfficeClass()}`}>
        <NavBar
          userDepartment={department}
          userType={type}
          userName={name}
          onLogout={onLogout}
          onNavItemClick={onNavItemClick}
        />
        <div className="office-records-header">
          <div className="header-flex">
            <div className="header-left">
              <Breadcrumbs />
            </div>
            <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
              {/*<Metrics />*/}
            </div>
          </div>
          <hr></hr>
          <div className="header-flex">
            <div className="header-left">
              <h2><FaFolder /> {getTitle()}</h2>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="loading-state">Loading records...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`office-records-container ${getOfficeClass()}`}>
        <NavBar
          userDepartment={department}
          userType={type}
          userName={name}
          onLogout={onLogout}
          onNavItemClick={onNavItemClick}
        />
        <div className="office-records-header">
          <div className="header-flex">
            <div className="header-left">
              <Breadcrumbs />
            </div>
            <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
              {/*<Metrics />*/}
            </div>
          </div>
          <hr></hr>
          <div className="header-flex">
            <div className="header-left">
              <h2><FaFolder /> {getTitle()}</h2>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="error-state">
            Error loading records: {error}
            <button onClick={fetchRecords} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`office-records-container ${getOfficeClass()}`}>
      {/* <DemoOverlay /> */}
      <NavBar
        userDepartment={department}
        userType={type}
        userName={name}
        onLogout={onLogout}
        onNavItemClick={onNavItemClick}
      />

      <div className="office-records-header">
        <div className="header-flex">
          <div className="header-left">
            <Breadcrumbs />
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            {/*<Metrics />*/}
          </div>
        </div>
        <hr></hr>
        <div className="header-flex">
          <div className="header-left">
            <h2><FaFolder /> {getTitle()}</h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            {type === "GCO" && (
              <AddButton onClick={handleAddRecord} type={type} />
            )}
            <SearchBar/>
            {/* <SearchBar onSearch={handleSearch} /> */}
          </div>
        </div>
      </div>
      
      <div className="content">
        <DataTable 
          data={sortedRecords} 
          columns={counselingColumns} 
          type={type}
          onRowClick={handleRowClick}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>

      {/* Add Record Modal */}
      <AddRecordComponent 
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onRecordAdded={handleRecordAdded}
        type={type}
      />

      {/* View Record Modal */}
      <ViewRecordComponent 
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        record={selectedRecord}
        type={type}
        onEdit={handleEditRecord}
      />

      {/* Edit Record Modal */}
      <EditRecordComponent 
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onRecordUpdated={handleRecordUpdated}
        type={type}
        record={selectedRecord}
      />

      <div className="footer">
        <div className="footer-header"><FaShieldAlt /> DATA PRIVACY CLOSURE</div>
        <div className="footer-text">
          To the extent permitted or required by law, we share, disclose, or transfer the information mentioned above with the permission of the data subjects to specific entities, organizations, or offices such as the Guidance and Counselling Office, the Office of the Prefect of Discipline, the Physical Education Department, and the Head Moderator. This is for the purpose of determining eligibility in academic competitions, eligibility in sports, exemptions from strenuous activities, as well as other similar events. All information provided is confidential and shall not be copied, shared, distributed, and used for any other purposes. We will use the collected data solely for our legitimate purposes and for the proper handling of records.
        </div>
      </div>
    </div>
  );
};

export default GCORecords;