// src/pages/INFRecords.js
import React, { useState, useEffect, useMemo } from 'react';
import NavBar from '../components/navigation/NavBar';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import Metrics from '../components/metrics/Metrics';
import SearchBar from '../components/search/SearchBar';
import AddButton from '../components/buttons/AddButton';
import FilterMedical from '../components/buttons/FilterMedical'; // NEW IMPORT
import DataTable from '../components/tables/DataTable';
import AddRecordComponent from '../components/modals/AddRecordComponent';
import ViewRecordComponent from '../components/modals/ViewRecordComponent';
import EditRecordComponent from '../components/modals/EditRecordComponent';
import { FaFolder, FaShieldAlt } from 'react-icons/fa';
import './OfficeRecords.css';
import DemoOverlay from './DemoOverlay';

const INFRecords = ({ userData, onLogout, onNavItemClick }) => {
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
  
  // Simplified filter states: All, Medical, Psychological
  const [currentFilter, setCurrentFilter] = useState('ALL');

  const getOfficeClass = () => {
    switch (type) {
      case "OPD": return "office-records-opd";
      case "GCO": return "office-records-gco";
      case "INF": return "office-records-inf";
      default: return "office-records-default";
    }
  };

  const getTitle = () => {
    if (type === "OPD") return "Medical and Psychological Records";
    if (type === "GCO") return "Referred Medical and Psychological Records";
    if (type === "INF") return "Medical and Psychological Records";
    return "Case Records";
  };

  // Get filter title based on current state
  const getFilterTitle = () => {
    switch (currentFilter) {
      case 'ALL': return "All Records";
      case 'MEDICALPSYCHOLOGICAL': return "Medical and Psychological Records";
      case 'MEDICAL': return "Medical Records";
      case 'PSYCHOLOGICAL': return "Psychological Records";
      default: return "Medical Records";
    }
  };

  // Table columns configuration
  const medicalColumns = [
    { key: 'recordId', label: 'Record No.', sortable: true },
    { key: 'id', label: 'ID No.', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    {
      key: 'attachments',
      label: 'Files',
      sortable: true,
      render: (attachments) => (
        <span>
          {attachments && attachments.length > 0 ? `${attachments.length} file(s)` : 'No files'}
        </span>
      )
    },
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

  // Filter records based on current filter state
  const filteredRecords = useMemo(() => {
    if (currentFilter === 'ALL') return records;

    return records.filter((record) => {
      if (currentFilter === 'MEDICALPSYCHOLOGICAL') {
        return record.isMedical === "Yes" && record.isPsychological === "Yes";
      }
      if (currentFilter === 'MEDICAL') {
        return record.isMedical === "Yes" && record.isPsychological === "No";
      }
      if (currentFilter === 'PSYCHOLOGICAL') {
        return record.isPsychological === "Yes" && record.isMedical === "No";
      }
      return true;
    });
  }, [records, currentFilter]);

  // Sort records based on sortConfig
  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
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
  }, [filteredRecords, sortConfig]);

  // Cycle through filter states
  const cycleFilter = () => {
    const filters = ['ALL', 'MEDICALPSYCHOLOGICAL', 'MEDICAL', 'PSYCHOLOGICAL'];
    const currentIndex = filters.indexOf(currentFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setCurrentFilter(filters[nextIndex]);
  };

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
      if (type === "GCO") {
        // GCO sees only referred records
        endpoint = "https://ccmr-final-node-production.up.railway.app/api/medical-records/referred";
      } else {
        // INF and OPD see all medical records - FIXED ENDPOINT
        endpoint = "https://ccmr-final-node-production.up.railway.app/api/infirmary/medical-records";
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
      console.error('Error fetching medical records:', err);
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
      if (type === "GCO") {
        // GCO searches only in referred records
        endpoint = `https://ccmr-final-node-production.up.railway.app/api/medical-records/referred/search?query=${encodeURIComponent(searchQuery)}`;
      } else {
        // INF and OPD search in all records - FIXED ENDPOINT
        endpoint = `https://ccmr-final-node-production.up.railway.app/api/medical-records/search?query=${encodeURIComponent(searchQuery)}`;
      }

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
      console.error('Error searching medical records:', err);
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

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedRecord(null);
    refreshRecords(); // Refresh data after closing edit modal
  };

  // FIXED: Proper record update handler with debug logging
  const handleRecordUpdated = (updatedRecord) => {
    console.log('=== RECORD UPDATE DEBUG ===');
    console.log('Current records:', records);
    console.log('Updated record:', updatedRecord);
    
    setRecords(prevRecords =>
      prevRecords.map(record => {
        // Handle all possible ID property names for comparison
        const currentId = record.recordId || record.mr_medical_id;
        const updatedId = updatedRecord.recordId || updatedRecord.mr_medical_id;
        
        console.log(`Comparing IDs: ${currentId} vs ${updatedId}`);
        
        if (currentId === updatedId) {
          console.log('✅ Record matched and will be updated');
          return updatedRecord;
        }
        return record;
      })
    );
    setShowEditModal(false);
    refreshRecords(); // Refresh data after updating record
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
            <h2><FaFolder /> {getFilterTitle()}</h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {type === "INF" && (
              <AddButton onClick={handleAddRecord} type={type} />
            )}
            
            {/* Single Filter Button */}
            <FilterMedical 
              type={type}
              onClick={cycleFilter}
              currentFilter={currentFilter}
            />

            <SearchBar/>
            {/* <SearchBar onSearch={handleSearch} /> */}
          </div>
        </div>
      </div>

      <div className="content">
        <DataTable
          data={sortedRecords}
          columns={medicalColumns}
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

export default INFRecords;