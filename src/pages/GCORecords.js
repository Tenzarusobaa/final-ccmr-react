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
  const [currentFilter, setCurrentFilter] = useState(null);

  // Handle filter from navigation
  useEffect(() => {
    if (location.state?.filter) {
      setCurrentFilter(location.state.filter);
      console.log('Received filter from navigation:', location.state.filter);
    }
  }, [location.state]);

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
          case 'TO_SCHEDULE': return "Psychological Records - To Schedule";
          case 'SCHEDULED': return "Psychological Records - Scheduled";
          case 'DONE': return "Psychological Records - Done";
          default: return "Psychological Records";
        }
      }
      return "Psychological Records";
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

  // Sort records based on sortConfig - FIXED: Only sort when we're in default mode
  const sortedRecords = useMemo(() => {
    if (!isSearchMode && sortConfig.key && records.length > 0) {
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
    }
    return records;
  }, [records, sortConfig, isSearchMode]);

  // Sort students based on sortConfig - FIXED: Only sort when we're in search mode
  const sortedStudents = useMemo(() => {
    if (isSearchMode && sortConfig.key && students.length > 0) {
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
    }
    return students;
  }, [students, sortConfig, isSearchMode]);

  // Handle sorting - FIXED: Reset data when switching modes
  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  // Clear filter
  const clearFilter = () => {
    setCurrentFilter(null);
    // Clear the navigation state
    window.history.replaceState({}, document.title);
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
      const url = filter ? `${endpoint}?filter=${filter}` : endpoint;

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

  // Fetch students with counseling records (search mode) - UPDATED for INF view
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);
      setRecords([]); // Clear records when switching to search mode

      let endpoint;
      if (viewType === "INF") {
        // INF should only see psychological counseling records
        endpoint = `${API_BASE_URL}api/student-counseling-records/psychological`;
      } else {
        // GCO sees all counseling records
        endpoint = `${API_BASE_URL}api/student-counseling-records`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStudents(data.students || []);
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search - UPDATED for INF view
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, show default records view
      fetchAllRecords(currentFilter);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);
      setRecords([]); // Clear records for search mode
      setStudents([]); // Clear students initially

      // Use different search endpoint based on viewType
      let endpoint;
      if (viewType === "INF") {
        // INF should only search psychological counseling records
        endpoint = `${API_BASE_URL}api/student-counseling-records/psychological/search?query=${encodeURIComponent(query)}`;
      } else {
        // GCO searches all counseling records
        endpoint = `${API_BASE_URL}api/student-counseling-records/search?query=${encodeURIComponent(query)}`;
      }

      console.log('Searching with viewType:', viewType, 'Endpoint:', endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // This should return aggregated student data like OPDRecords
        setStudents(data.students || []);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery);
    } else {
      fetchAllRecords(currentFilter);
    }
  };

  useEffect(() => {
    fetchAllRecords(currentFilter);
  }, [viewType, currentFilter]);

  const handleAddRecord = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    refreshData();
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    refreshData();
  };

  const handleRecordAdded = () => {
    setShowAddModal(false);
    refreshData();
  };

  const handleRowClick = (recordOrStudent) => {
    if (isSearchMode) {
      // In search mode with aggregated students view
      if (recordOrStudent.counselingCount !== undefined) {
        // This is a student object from aggregated view
        setSelectedStudent(recordOrStudent);
        setShowStudentModal(true);
      } else {
        // This is a record object from search results
        setSelectedStudent({
          id: recordOrStudent.id,
          name: recordOrStudent.name,
          strand: recordOrStudent.strand,
          gradeLevel: recordOrStudent.gradeLevel,
          section: recordOrStudent.section
        });
        setShowStudentModal(true);
      }
    } else {
      // In default mode, we have individual record objects
      // Open ViewRecordComponent directly with the record (like OPDRecords and INFRecords)
      setSelectedRecord(recordOrStudent);
      setShowViewModal(true);
    }
  };


  // Determine which data to display based on mode
  const displayData = useMemo(() => {
    if (isSearchMode) {
      // In search mode, we show aggregated students
      return { data: sortedStudents, columns: studentColumns, type: 'students' };
    } else {
      // In default mode, always show records
      return { data: sortedRecords, columns: recordColumns, type: 'records' };
    }
  }, [isSearchMode, sortedStudents, sortedRecords]);

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
            <button onClick={refreshData} className="retry-button">
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
          <div className="header-left">
            <h2><FaFolder /> {getTitle()}
              {isSearchMode && searchQuery && ` - Search: "${searchQuery}"`}
              {currentFilter && !isSearchMode && (
                <span className="filter-indicator">
                  (Filtered: {currentFilter})
                  <button onClick={clearFilter} className="clear-filter-btn">
                    Clear Filter
                  </button>
                </span>
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
        {displayData.data.length === 0 ? (
          <div className="empty-state">
            {isSearchMode && searchQuery
              ? "No students found matching your search."
              : "No records found. Create a new record to get started."}
          </div>
        ) : (
          <DataTable
            data={displayData.data}
            columns={displayData.columns}
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
          refreshData();
        }}
        onRecordUpdated={() => {
          setShowEditModal(false);
          setEditRecordData(null);
          refreshData();
        }}
        type={viewType}
        record={editRecordData}
      />

      <ViewStudentRecordsComponent
        isOpen={showStudentModal}
        onClose={handleCloseStudentModal}
        student={selectedStudent}
        type={viewType}
        recordType="counseling"
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
