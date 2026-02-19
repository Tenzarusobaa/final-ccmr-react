// src/pages/AdminVIEW/AdminOPDRecords.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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

const AdminOPDRecords = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
  const location = useLocation();
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Administrator';
  const type = userData?.type || localStorage.getItem('type') || 'Administrator';

  // Force viewType to be Administrator for admin view pages
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

  // Use default styling for admin view
  const getOfficeClass = () => "office-records-default";

  const getTitle = () => {
    return "OPD Case Records (Admin View)";
  };

  // Student columns for search results (aggregated view)
  const studentColumns = [
    {
      key: 'id',
      label: 'ID No.',
      sortable: true,
    },
    { key: 'name', label: 'Student Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { key: 'gradeLevel', label: 'Grade Level', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    {
      key: 'caseCount',
      label: 'Case Count',
      sortable: true,
      render: (value) => (
        <span className={`case-count-badge ${value > 0 ? 'has-cases' : 'no-cases'}`}>
          {value} case{value !== 1 ? 's' : ''}
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
    { key: 'caseNo', label: 'Case No.', sortable: true },
    { key: 'id', label: 'ID No.', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { key: 'gradeLevel', label: 'Grade Level', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'schoolYearSemester', label: 'School Year & Semester', sortable: true },
    { key: 'violationLevel', label: 'Severity', sortable: true },
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

      // Handle dates
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date || '1970-01-01');
        const dateB = new Date(b.date || '1970-01-01');
        return sortConfig.direction === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }

      // Handle numeric fields
      if (sortConfig.key === 'caseNo' || sortConfig.key === 'gradeLevel') {
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

      if (sortConfig.key === 'caseCount' || sortConfig.key === 'gradeLevel') {
        const aNum = parseInt(aValue, 10);
        const bNum = parseInt(bValue, 10);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (isNaN(bNum)) return sortConfig.direction === 'asc' ? 1 : -1;

        return sortConfig.direction === 'asc'
          ? aNum - bNum
          : bNum - aNum;
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

  // Fetch all case records (default view)
  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(false);

      const endpoint = `${API_BASE_URL}api/case-records`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
        setStudents([]);
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

  // Fetch students with case records (search mode)
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);

      const endpoint = `${API_BASE_URL}api/student-case-records`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStudents(data.students || []);
        setRecords([]);
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

      const endpoint = `${API_BASE_URL}api/student-case-records/search?query=${encodeURIComponent(query)}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStudents(data.students || []);
        setRecords([]);
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
      // In search mode, we have student objects with aggregated data
      setSelectedStudent(recordOrStudent);
      setShowStudentModal(true);
    } else {
      // In default mode, we have individual record objects
      // Open ViewRecordComponent directly with the record
      setSelectedRecord(recordOrStudent);
      setShowViewModal(true);
    }
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
        {isSearchMode ? (
          // Search mode: Show aggregated student table
          <>
            <DataTable
              data={sortedStudents}
              columns={studentColumns}
              type={viewType}
              onRowClick={handleRowClick}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          </>
        ) : (
          // Default mode: Show flat table of individual records
          <>
            {sortedRecords.length === 0 ? (
              <div className="empty-state">No records found.</div>
            ) : (
              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {recordColumns.map((column) => (
                        <th
                          key={column.key}
                          onClick={() => column.sortable && handleSort({
                            key: column.key,
                            direction: sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                          })}
                          className={column.sortable ? 'sortable' : ''}
                        >
                          <span className="column-header-content">
                            {column.label}
                            {column.sortable && (
                              <span className="sort-indicator">
                                {sortConfig && sortConfig.key === column.key
                                  ? sortConfig.direction === 'asc' ? '↑' : '↓'
                                  : '↕️'
                                }
                              </span>
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record, index) => (
                      <tr
                        key={record.caseNo || `row-${index}`}
                        onClick={() => handleRowClick(record)}
                        className="clickable-row"
                        style={{ cursor: 'pointer' }}
                      >
                        {recordColumns.map((column) => (
                          <td key={column.key}>
                            {column.render ? column.render(record[column.key], record) : record[column.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
        recordType="case"
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

export default AdminOPDRecords;