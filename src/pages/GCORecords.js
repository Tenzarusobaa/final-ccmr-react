// src/pages/GCORecords.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/navigation/NavBar';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import SearchBar from '../components/search/SearchBar';
import AddButton from '../components/buttons/AddButton';
import DataTable from '../components/tables/DataTable';
import AddRecordComponent from '../components/modals/AddRecordComponent';
import ViewStudentRecordsComponent from '../components/modals/ViewStudentRecordsComponent';
import { FaFolder, FaShieldAlt, FaUser, FaComments } from 'react-icons/fa';
import './OfficeRecords.css';
import ViewRecordComponent from '../components/modals/ViewRecordComponent';
import EditRecordComponent from '../components/modals/EditRecordComponent';

const API_BASE_URL = process.env.REACT_APP_NODE_SERVER_URL || 'http://localhost:5000/';

const GCORecords = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
  const location = useLocation();
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Unknown Department';
  const type = userData?.type || localStorage.getItem('type') || 'Unknown Type';
  const viewType = userData?.viewType || type;

  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecordData, setEditRecordData] = useState(null);
  
  // FIXED: Added state to track if we need to force refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get filter from localStorage on component mount, or from location.state
  const [currentFilter, setCurrentFilter] = useState(() => {
    // Try to get from localStorage first (persists across refreshes)
    const savedFilter = localStorage.getItem(`${viewType}_filter`);
    if (savedFilter) {
      console.log('Loaded filter from localStorage:', savedFilter);
      return savedFilter;
    }
    return null;
  });

  // FIXED: Improved filter handling to detect navigation changes
  useEffect(() => {
    if (location.state?.filter) {
      const newFilter = location.state.filter;
      console.log('Received filter from navigation:', newFilter);
      
      // Only update if filter has changed
      if (newFilter !== currentFilter) {
        setCurrentFilter(newFilter);
        // Save to localStorage so it persists on refresh
        localStorage.setItem(`${viewType}_filter`, newFilter);
        
        // FIXED: Trigger a refresh when filter changes from navigation
        setRefreshTrigger(prev => prev + 1);
        
        // Clear the navigation state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, viewType, currentFilter]);

  // Clear filter from localStorage when component unmounts or when clearing filter
  useEffect(() => {
    return () => {
      // Optional: You can clear the filter when leaving the page
      // localStorage.removeItem(`${viewType}_filter`);
    };
  }, [viewType]);

  const getOfficeClass = () => {
    switch (viewType) {
      case "OPD": return "office-records-opd";
      case "GCO": return "office-records-gco";
      case "INF": return "office-records-inf";
      default: return "office-records-default";
    }
  };

  const getTitle = () => {
    if (viewType === "GCO") {
      if (currentFilter) {
        switch (currentFilter) {
          case 'ALL': return "Counseling Records - All";
          case 'TO_SCHEDULE': return "Counseling Records - To Schedule";
          case 'SCHEDULED': return "Counseling Records - Scheduled";
          case 'DONE': return "Counseling Records - Done";
          default: return "Counseling Records";
        }
      }
      return "Counseling Records";
    }
    if (viewType === "INF") {
      if (currentFilter) {
        switch (currentFilter) {
          case 'ALL': return "Infirmary Records - All";
          case 'MEDICAL': return "Infirmary Records - Medical";
          case 'PSYCHOLOGICAL': return "Infirmary Records - Psychological";
          case 'TO_SCHEDULE': return "Psychological Records - To Schedule";
          case 'SCHEDULED': return "Psychological Records - Scheduled";
          case 'DONE': return "Psychological Records - Done";
          default: return "Infirmary Records";
        }
      }
      return "Infirmary Records";
    }
    return "Counseling Records";
  };

  // Student columns for search results (aggregated view)
  const studentColumns = [
    {
      key: 'id',
      label: 'ID No.',
      sortable: true,
      render: (value, row) => (
        <div className="student-id-cell">
          <FaUser className="student-icon" />
          <span>{value}</span>
        </div>
      )
    },
    { key: 'name', label: 'Student Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { key: 'gradeLevel', label: 'Grade Level', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    {
      key: 'counselingCount',
      label: 'Session Count',
      sortable: true,
      render: (value) => (
        <span className={`session-count-badge ${value > 0 ? 'has-sessions' : 'no-sessions'}`}>
          {value} session{value !== 1 ? 's' : ''}
        </span>
      )
    },
    {
      key: 'latestStatus',
      label: 'Latest Status',
      sortable: true,
      render: (value) => (
        <span className={`status-badge status-${value?.toLowerCase() || 'unknown'}`}>
          {value || 'No Status'}
        </span>
      )
    }
  ];

  // Record columns for default view (individual records)
  const recordColumns = [
    { key: 'sessionNumber', label: 'Session No.', sortable: true },
    { key: 'id', label: 'ID No.', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { key: 'gradeLevel', label: 'Grade Level', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'schoolYearSemester', label: 'School Year & Semester', sortable: true },
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
    { key: 'date', label: 'Date', sortable: true },
    { key: 'time', label: 'Time', sortable: true }
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

      // Handle dates
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date || '1970-01-01');
        const dateB = new Date(b.date || '1970-01-01');
        return sortConfig.direction === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }

      // Handle numeric fields
      if (sortConfig.key === 'sessionNumber' || sortConfig.key === 'gradeLevel') {
        const aNum = parseInt(aValue, 10);
        const bNum = parseInt(bValue, 10);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (isNaN(bNum)) return sortConfig.direction === 'asc' ? 1 : -1;

        return sortConfig.direction === 'asc'
          ? aNum - bNum
          : bNum - aNum;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Default comparison
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, sortConfig]);

  // Sort students based on sortConfig
  const sortedStudents = useMemo(() => {
    if (!sortConfig.key) return students;

    return [...students].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (sortConfig.key === 'counselingCount' || sortConfig.key === 'gradeLevel') {
        const aNum = parseInt(aValue, 10);
        const bNum = parseInt(bValue, 10);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (isNaN(bNum)) return sortConfig.direction === 'asc' ? 1 : -1;

        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, sortConfig]);

  // Handle sorting
  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  // Clear filter - FIXED: Properly clear from localStorage and refresh
  const clearFilter = () => {
    console.log('Clearing filter');
    setCurrentFilter(null);
    // Remove from localStorage
    localStorage.removeItem(`${viewType}_filter`);
    // Clear the navigation state
    window.history.replaceState({}, document.title);
    // Refresh data without filter
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch all counseling records (default view) - UPDATED for INF view
  const fetchAllRecords = async (filter = null) => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(false);
      setStudents([]); // Clear students when switching to default mode

      let endpoint;
      if (viewType === "INF") {
        // INF should only see psychological counseling records
        endpoint = `${API_BASE_URL}api/infirmary/counseling-records`;
      } else {
        // GCO sees all counseling records
        endpoint = `${API_BASE_URL}api/counseling-records`;
      }

      // Add filter parameter if provided
      let url = endpoint;
      if (filter && filter !== 'ALL') {
        url = `${endpoint}?filter=${filter}`;
      }

      console.log('Fetching records from:', url, 'with filter:', filter);

      const response = await fetch(url);

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

  // Handle search - FIXED: Use proper search endpoints
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, show default records view with current filter
      fetchAllRecords(currentFilter);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);
      setRecords([]); // Clear records for search mode

      // Use different search endpoint based on viewType
      let endpoint;
      if (viewType === "INF") {
        // INF should only search psychological counseling records
        endpoint = `${API_BASE_URL}api/counseling-records/search?query=${encodeURIComponent(query)}`;
      } else {
        // GCO searches all counseling records
        endpoint = `${API_BASE_URL}api/counseling-records/search?query=${encodeURIComponent(query)}`;
      }

      console.log('Searching with viewType:', viewType, 'Endpoint:', endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // This returns individual counseling records, not aggregated student data
        setRecords(data.records || []);
        setStudents([]);
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

  // Refresh data - FIXED: Properly handle currentFilter
  const refreshData = () => {
    console.log('Refreshing data with filter:', currentFilter);
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery);
    } else {
      fetchAllRecords(currentFilter);
    }
  };

  // FIXED: Main effect to fetch data with refreshTrigger dependency
  useEffect(() => {
    console.log('useEffect triggered with filter:', currentFilter, 'refreshTrigger:', refreshTrigger);
    fetchAllRecords(currentFilter);
  }, [viewType, currentFilter, refreshTrigger]); // Added refreshTrigger dependency

  // Also refresh data when a record is updated (for the filter issue you mentioned)
  useEffect(() => {
    // This effect runs when showEditModal changes (when you close edit modal)
    if (!showEditModal && !isSearchMode) {
      // Refresh data after editing a record to ensure filter is applied
      console.log('Refreshing data after edit modal closed');
      setRefreshTrigger(prev => prev + 1);
    }
  }, [showEditModal, isSearchMode, currentFilter]);

  const handleAddRecord = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecordAdded = () => {
    setShowAddModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
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
        {/* View As Banner for Administrator */}
        {type === "Administrator" && viewType !== "Administrator" && (
          <div className="view-as-banner">
            <div className="view-as-content">
              <span className="view-as-text">
                You are viewing as: <strong>{viewType}</strong>
              </span>
              <button
                onClick={onExitViewAs}
                className="exit-view-as-btn"
              >
                Exit View As
              </button>
            </div>
          </div>
        )}
        <div className="office-records-header">
          <div className="header-flex">
            <div className="header-left">
              <Breadcrumbs />
            </div>
          </div>
          <hr />
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
        {/* View As Banner for Administrator */}
        {type === "Administrator" && viewType !== "Administrator" && (
          <div className="view-as-banner">
            <div className="view-as-content">
              <span className="view-as-text">
                You are viewing as: <strong>{viewType}</strong>
              </span>
              <button
                onClick={onExitViewAs}
                className="exit-view-as-btn"
              >
                Exit View As
              </button>
            </div>
          </div>
        )}
        <div className="office-records-header">
          <div className="header-flex">
            <div className="header-left">
              <Breadcrumbs />
            </div>
          </div>
          <hr />
          <div className="header-flex">
            <div className="header-left">
              <h2><FaFolder /> {getTitle()}</h2>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="error-state">
            Error loading records: {error}
            <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`office-records-container ${getOfficeClass()}`}>
      <NavBar
        userDepartment={department}
        userType={type}
        userName={name}
        onLogout={onLogout}
        onNavItemClick={onNavItemClick}
        onExitViewAs={onExitViewAs}
      />

      {/* View As Banner for Administrator */}
      {type === "Administrator" && viewType !== "Administrator" && (
        <div className="view-as-banner">
          <div className="view-as-content">
            <span className="view-as-text">
              You are viewing as: <strong>{viewType}</strong>
            </span>
            <button
              onClick={onExitViewAs}
              className="exit-view-as-btn"
            >
              Exit View As
            </button>
          </div>
        </div>
      )}

      <div className="office-records-header">
        <div className="header-flex">
          <div className="header-left">
            <Breadcrumbs />
          </div>
        </div>
        <hr />
        <div className="header-flex">
          <div className="header-left" style={{ display: 'flex' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaFolder /> {getTitle()}
              {isSearchMode && searchQuery && ` - Search: "${searchQuery}"`}
              {currentFilter && !isSearchMode && (
                <AddButton
                  onClick={clearFilter}
                  label="Clear Filter"
                  title="Clear Filter"
                  type={viewType}
                />
              )}
            </h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            {viewType === "GCO" && type === "GCO" && (
              <AddButton onClick={handleAddRecord} type={viewType} />
            )}
            <SearchBar onSearch={handleSearch} placeholder="Search by ID, Name, or Strand" />
          </div>
        </div>
      </div>

      <div className="content">
        {sortedRecords.length === 0 ? (
          <div className="empty-state">
            {isSearchMode && searchQuery
              ? "No records found matching your search."
              : currentFilter
              ? `No ${getTitle().toLowerCase()} found.`
              : "No records found. Create a new record to get started."}
          </div>
        ) : (
          <DataTable
            data={sortedRecords}
            columns={recordColumns}
            type={viewType}
            onRowClick={handleRowClick}
            onSort={handleSort}
            sortConfig={sortConfig}
          />
        )}
      </div>

      <AddRecordComponent
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onRecordAdded={handleRecordAdded}
        type={viewType}
      />

      <ViewRecordComponent
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRecord(null);
        }}
        onEdit={(record) => {
          setSelectedRecord(null);
          setShowViewModal(false);
          setEditRecordData(record);
          setShowEditModal(true);
        }}
        record={selectedRecord}
        type={viewType}
      />

      <EditRecordComponent
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditRecordData(null);
        }}
        onRecordUpdated={() => {
          setShowEditModal(false);
          setEditRecordData(null);
        }}
        type={viewType}
        record={editRecordData}
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