// src/pages/AdminVIEW/AdminGCORecords.js
import React, { useState, useEffect, useMemo } from 'react';
import NavBar from '../../components/navigation/NavBar';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import SearchBar from '../../components/search/SearchBar';
import DataTable from '../../components/tables/DataTable';
import ViewStudentRecordsComponent from '../../components/modals/ViewStudentRecordsComponent';
import { FaFolder, FaShieldAlt, FaUser } from 'react-icons/fa';
import '../OfficeRecords.css';
import ViewRecordComponent from '../../components/modals/ViewRecordComponent';
import EditRecordComponent from '../../components/modals/EditRecordComponent';

const API_BASE_URL = process.env.REACT_APP_NODE_SERVER_URL || 'http://localhost:5000/';

const AdminGCORecords = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Administrator';
  const type = userData?.type || localStorage.getItem('type') || 'Administrator';

  // Force viewType to be Administrator for this admin view
  const viewType = "Administrator";

  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecordData, setEditRecordData] = useState(null);

  const getOfficeClass = () => "office-records-default";
  const getTitle = () => "Counseling Records (Admin View)";

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

  // Sort records based on sortConfig - Only sort when we're in default mode
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

  // Sort students based on sortConfig - Only sort when we're in search mode
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

  // Handle sorting
  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  // Fetch all counseling records (default view)
  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(false);
      setStudents([]); // Clear students when switching to default mode

      const endpoint = `${API_BASE_URL}api/counseling-records`;

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

  // Fetch students with counseling records (search mode)
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);
      setRecords([]); // Clear records when switching to search mode

      const endpoint = `${API_BASE_URL}api/student-counseling-records`;

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

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, show default records view
      fetchAllRecords();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);
      setRecords([]); // Clear records for search mode
      setStudents([]); // Clear students initially

      const endpoint = `${API_BASE_URL}api/counseling-records/search?query=${encodeURIComponent(query)}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Search returns individual records, not aggregated students
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

  // Refresh data
  const refreshData = () => {
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery);
    } else {
      fetchAllRecords();
    }
  };

  useEffect(() => {
    fetchAllRecords();
  }, []);

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
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
      // Open ViewRecordComponent directly with the record
      setSelectedRecord(recordOrStudent);
      setShowViewModal(true);
    }
  };

  // Determine which data to display based on mode
  const displayData = useMemo(() => {
    if (isSearchMode) {
      // In search mode, we might show either students or records
      if (students.length > 0) {
        return { data: sortedStudents, columns: studentColumns, type: 'students' };
      } else {
        return { data: sortedRecords, columns: recordColumns, type: 'records' };
      }
    } else {
      // In default mode, always show records
      return { data: sortedRecords, columns: recordColumns, type: 'records' };
    }
  }, [isSearchMode, students, sortedStudents, sortedRecords]);

  // Render loading state
  if (loading) {
    return (
      <div className={`office-records-container ${getOfficeClass()}`}>
        <NavBar
          userDepartment={department}
          userType={type}
          userName={name}
          onLogout={onLogout}
          onExitViewAs={onExitViewAs}
        />
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
          <div className="loading-state">Loading counseling records...</div>
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
          onExitViewAs={onExitViewAs}
        />
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
        onExitViewAs={onExitViewAs}
      />
      <div className="office-records-header">
        <div className="header-flex">
          <div className="header-left">
            <Breadcrumbs />
          </div>
        </div>
        <hr />
        <div className="header-flex">
          <div className="header-left">
            <h2><FaFolder /> {getTitle()} {isSearchMode && searchQuery && `- Search: "${searchQuery}"`}</h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="admin-view-indicator" style={{ marginRight: '15px' }}>
              <span className="admin-badge">Read-Only Mode</span>
            </div>
            <SearchBar onSearch={handleSearch} placeholder="Search by ID, Name, or Strand" />
          </div>
        </div>
      </div>

      <div className="content">
        {displayData.data.length === 0 ? (
          <div className="empty-state">
            {isSearchMode && searchQuery
              ? "No counseling records found matching your search."
              : "No counseling records found."}
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

      <ViewRecordComponent
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRecord(null);
        }}
        onEdit={(record) => {
          setSelectedRecord(null);
          setShowViewModal(false);
          // For admin, we still open the edit component but it will be view-only
          setEditRecordData({
            ...record,
            isAdminViewOnly: true // Add a flag to indicate admin view-only mode
          });
          setShowEditModal(true);
        }}
        record={selectedRecord}
        type={viewType}
      />

      {/* EditRecordComponent for admin - will show in view-only mode */}
      <EditRecordComponent
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditRecordData(null);
        }}
        onRecordUpdated={() => {
          // This won't be called since admin can't save
          setShowEditModal(false);
          setEditRecordData(null);
        }}
        type={viewType}
        record={editRecordData}
        isAdminViewOnly={true} // Pass prop to indicate admin view-only mode
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

export default AdminGCORecords;