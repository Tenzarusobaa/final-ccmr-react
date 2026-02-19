// src/pages/INFRecords.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/navigation/NavBar';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import SearchBar from '../components/search/SearchBar';
import AddButton from '../components/buttons/AddButton';
import FilterMedical from '../components/buttons/FilterMedical';
import DataTable from '../components/tables/DataTable';
import AddRecordComponent from '../components/modals/AddRecordComponent';
import ViewStudentRecordsComponent from '../components/modals/ViewStudentRecordsComponent';
import { FaFolder, FaShieldAlt, FaUser, FaFileMedical, FaStethoscope } from 'react-icons/fa';
import './OfficeRecords.css';
import ViewRecordComponent from '../components/modals/ViewRecordComponent';
import EditRecordComponent from '../components/modals/EditRecordComponent';

const API_BASE_URL = process.env.REACT_APP_NODE_SERVER_URL || 'http://localhost:5000/';

const INFRecords = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
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
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecordData, setEditRecordData] = useState(null);

  // Handle filter from navigation
  useEffect(() => {
    if (location.state?.filter) {
      const filter = location.state.filter;
      setCurrentFilter(filter === 'MEDICAL' ? 'MEDICAL' :
        filter === 'PSYCHOLOGICAL' ? 'PSYCHOLOGICAL' : 'ALL');
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
    if (viewType === "INF") return "Medical Records";
    if (viewType === "GCO") return "Referred Medical Records";
    return "Medical Records";
  };

  const getFilterTitle = () => {
    if (viewType === "GCO") {
      // GCO should only see referred records
      switch (currentFilter) {
        case 'ALL': return "All Referred Records";
        case 'MEDICALPSYCHOLOGICAL': return "Referred Medical & Psychological Records (Both)";
        case 'MEDICAL': return "Referred Medical Records Only";
        case 'PSYCHOLOGICAL': return "Referred Psychological Records Only";
        default: return "Referred Medical Records";
      }
    } else {
      // INF sees all records
      switch (currentFilter) {
        case 'ALL': return "All Records";
        case 'MEDICALPSYCHOLOGICAL': return "Medical & Psychological Records (Both)";
        case 'MEDICAL': return "Medical Records Only";
        case 'PSYCHOLOGICAL': return "Psychological Records Only";
        default: return "Medical Records";
      }
    }
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
      key: 'medicalCount',
      label: 'Record Count',
      sortable: true,
      render: (value) => (
        <span className={`medical-count-badge ${value > 0 ? 'has-records' : 'no-records'}`}>
          <FaFileMedical style={{ marginRight: '5px' }} />
          {value} record{value !== 1 ? 's' : ''}
        </span>
      )
    },
    {
      key: 'recordTypes',
      label: 'Record Types',
      sortable: false,
      render: (_, row) => {
        const types = [];
        if (row.hasMedical && row.hasMedical.includes('Yes')) types.push('Medical');
        if (row.hasPsychological && row.hasPsychological.includes('Yes')) types.push('Psychological');

        return (
          <div className="record-types">
            {types.map(type => (
              <span key={type} className={`type-badge type-${type.toLowerCase()}`}>
                {type}
              </span>
            ))}
          </div>
        );
      }
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
    { key: 'recordId', label: 'Record No.', sortable: true },
    { key: 'id', label: 'ID No.', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { key: 'gradeLevel', label: 'Grade Level', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'schoolYearSemester', label: 'School Year & Semester', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
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
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (_, row) => {
        const types = [];
        if (row.isMedical === 'Yes') types.push('Medical');
        if (row.isPsychological === 'Yes') types.push('Psychological');
        return types.join(', ') || 'None';
      }
    },
    { key: 'date', label: 'Date', sortable: true }
  ];

  // Helper function to get type value for sorting
  const getTypeValue = (record) => {
    const types = [];
    if (record.isMedical === 'Yes') types.push('Medical');
    if (record.isPsychological === 'Yes') types.push('Psychological');
    return types.sort().join(', ') || 'None';
  };

  // Sort records based on sortConfig
  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return records;

    return [...records].sort((a, b) => {
      // Special handling for type column
      if (sortConfig.key === 'type') {
        const aValue = getTypeValue(a);
        const bValue = getTypeValue(b);

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

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
      }

      // For all other columns, use the original logic
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
      if (sortConfig.key === 'recordId' || sortConfig.key === 'gradeLevel') {
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

      if (sortConfig.key === 'medicalCount' || sortConfig.key === 'gradeLevel') {
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

  const cycleFilter = () => {
    const filters = ['ALL', 'MEDICALPSYCHOLOGICAL', 'MEDICAL', 'PSYCHOLOGICAL'];
    const currentIndex = filters.indexOf(currentFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    const newFilter = filters[nextIndex];

    console.log(`Cycling filter from ${currentFilter} to ${newFilter}`);
    setCurrentFilter(newFilter);
    // Clear navigation state when manually cycling filter
    window.history.replaceState({}, document.title);

    // If we're in search mode with a query, refresh search with new filter
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery);
    } else if (isSearchMode) {
      // If we're in search mode but no query, fetch students with new filter
      fetchStudents();
    } else {
      // In default mode, fetch all records with filter applied
      fetchAllRecords();
    }
  };

  // Clear filter
  const clearFilter = () => {
    console.log('Clearing filter, setting to ALL');
    setCurrentFilter('ALL');
    // Clear the navigation state
    window.history.replaceState({}, document.title);
    
    // Refresh data with ALL filter
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery);
    } else if (isSearchMode) {
      fetchStudents();
    } else {
      fetchAllRecords();
    }
  };

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  // Fetch all medical records (default view) - UPDATED for GCO view
  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(false);

      let endpoint;
      if (viewType === "GCO") {
        // GCO should only see referred medical records
        endpoint = `${API_BASE_URL}api/medical-records/referred?filter=${currentFilter}`;
      } else {
        // INF sees all medical records
        endpoint = `${API_BASE_URL}api/infirmary/medical-records?filter=${currentFilter}`;
      }

      console.log('Fetching records with viewType:', viewType, 'filter:', currentFilter, 'Endpoint:', endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`Fetched ${data.records?.length || 0} records with filter: ${currentFilter}`);
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

  // Fetch students with medical records (search mode) - UPDATED for GCO view
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);

      let endpoint;
      if (viewType === "GCO") {
        // GCO should only see referred medical records
        endpoint = `${API_BASE_URL}api/student-medical-records/referred?filter=${currentFilter}`;
      } else {
        // INF sees all medical records
        endpoint = `${API_BASE_URL}api/student-medical-records?filter=${currentFilter}`;
      }

      console.log('Fetching students with viewType:', viewType, 'filter:', currentFilter, 'Endpoint:', endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`Fetched ${data.students?.length || 0} students with filter: ${currentFilter}`);
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

  // Handle search - UPDATED for GCO view
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

      // Use different search endpoint based on viewType
      let endpoint;
      if (viewType === "GCO") {
        // GCO should only search referred medical records
        endpoint = `${API_BASE_URL}api/student-medical-records/referred/search?query=${encodeURIComponent(query)}&filter=${currentFilter}`;
      } else {
        // INF searches all medical records
        endpoint = `${API_BASE_URL}api/student-medical-records/search?query=${encodeURIComponent(query)}&filter=${currentFilter}`;
      }

      console.log('Searching with viewType:', viewType, 'query:', query, 'filter:', currentFilter, 'Endpoint:', endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // This should return aggregated student data
        console.log(`Search returned ${data.students?.length || 0} students with filter: ${currentFilter}`);
        setStudents(data.students || []);
        setRecords([]); // Clear individual records
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching medical students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (isSearchMode && searchQuery) {
      handleSearch(searchQuery);
    } else if (isSearchMode) {
      fetchStudents();
    } else {
      fetchAllRecords();
    }
  };

  useEffect(() => {
    if (isSearchMode && !searchQuery) {
      fetchStudents();
    } else {
      fetchAllRecords();
    }
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

  const handleRowClick = async (recordOrStudent) => {
    if (isSearchMode) {
      // In search mode, we have aggregated student objects
      if (recordOrStudent.medicalCount !== undefined) {
        // This is a student object from aggregated view
        setSelectedStudent(recordOrStudent);
        setShowStudentModal(true);
      } else {
        // This is a record object (shouldn't happen in search mode now)
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
      // Fetch the full record details from the API
      try {
        const recordId = recordOrStudent.recordId || recordOrStudent.mr_medical_id;
        const response = await fetch(`${API_BASE_URL}api/medical-records/${recordId}`);
        const data = await response.json();

        if (data.success && data.record) {
          setSelectedRecord(data.record);
          setShowViewModal(true);
        } else {
          // Fallback to the record we have
          console.warn('Failed to fetch full record details, using partial data');
          setSelectedRecord(recordOrStudent);
          setShowViewModal(true);
        }
      } catch (error) {
        console.error('Error fetching record details:', error);
        // Fallback to the record we have
        setSelectedRecord(recordOrStudent);
        setShowViewModal(true);
      }
    }
  };

  // Only show filter button for INF users, not for GCO users
  const showFilterButton = viewType === "INF" && (!isSearchMode || !searchQuery);

  // Check if we should show clear filter button
  const shouldShowClearFilter = currentFilter !== 'ALL';

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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaFolder /> {getFilterTitle()}
                {isSearchMode && searchQuery && ` - Search: "${searchQuery}"`}
              </span>
              {shouldShowClearFilter && !isSearchMode && (
                <AddButton
                  onClick={clearFilter}
                  label="Clear Filter"
                  title="Clear Filter"
                  type={viewType}
                />
              )}
            </h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {viewType === "INF" && type === "INF" && (
              <AddButton onClick={handleAddRecord} type={viewType} />
            )}

            {showFilterButton && (
              <FilterMedical
                type={viewType}
                onClick={cycleFilter}
                currentFilter={currentFilter}
              />
            )}

            <SearchBar onSearch={handleSearch} placeholder="Search by ID, Name, or Strand" />
          </div>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading-state">Loading records...</div>
        ) : error ? (
          <div className="error-state">Error: {error}</div>
        ) : isSearchMode ? (
          // Search mode: Show aggregated student table
          sortedStudents.length > 0 ? (
            <DataTable
              data={sortedStudents}
              columns={studentColumns}
              type={viewType}
              onRowClick={handleRowClick}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          ) : (
            <div className="empty-state">No students found matching your search.</div>
          )
        ) : (
          // Default mode: Show flat table of individual records
          <>
            {sortedRecords.length === 0 ? (
              <div className="empty-state">No records found. Create a new record to get started.</div>
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
                        key={record.recordId || `row-${index}`}
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
        recordType="medical"
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