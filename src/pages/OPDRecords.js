// src/pages/OPDRecords.js
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
import './OfficeRecords.css';
import DemoOverlay from './DemoOverlay';

const OPDRecords = ({ userData, onLogout, onNavItemClick }) => {
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
    if (type === "OPD") return "Case Records";
    if (type === "GCO") return "Referred Case Records";
    return "Case Records";
  };

  const caseColumns = [
    { key: 'caseNo', label: 'Case No.', sortable: true },
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

      // Special handling for caseNo to sort numerically
      if (sortConfig.key === 'caseNo') {
        const aNum = parseInt(aValue, 10);
        const bNum = parseInt(bValue, 10);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (isNaN(bNum)) return sortConfig.direction === 'asc' ? 1 : -1;
        
        return sortConfig.direction === 'asc' 
          ? aNum - bNum 
          : bNum - aNum;
      }

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

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = type === "GCO"
        ? "https://ccmr-final-node-production.up.railway.app/api/case-records/referred"
        : "https://ccmr-final-node-production.up.railway.app/api/case-records";

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
      console.error('Error fetching records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      fetchRecords();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = type === "GCO"
        ? `https://ccmr-final-node-production.up.railway.app/api/case-records/referred/search?query=${encodeURIComponent(searchQuery)}`
        : `https://ccmr-final-node-production.up.railway.app/api/case-records/search?query=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching records:', err);
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
  }, [type]);

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

  const handleRowClick = (record) => {
    console.log('Record clicked:', record);
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleRecordUpdated = (updatedRecord) => {
    setRecords(prevRecords =>
      prevRecords.map(record =>
        record.caseNo === updatedRecord.caseNo ? updatedRecord : record
      )
    );
    setShowEditModal(false);
    refreshRecords(); // Refresh data after updating record
  };

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
              <Metrics />
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
              <Metrics />
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
            {type === "OPD" && (
              <AddButton onClick={handleAddRecord} type={type} />
            )}
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="content">
        <DataTable
          data={sortedRecords}
          columns={caseColumns}
          type={type}
          onRowClick={handleRowClick}
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>

      <AddRecordComponent
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onRecordAdded={handleRecordAdded}
        type={type}
      />

      <ViewRecordComponent
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        record={selectedRecord}
        type={type}
        onEdit={handleEditRecord}
      />

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

export default OPDRecords;