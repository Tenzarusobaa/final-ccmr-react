// src/pages/AdminVIEW/AdminINFRecords.js
import React, { useState, useEffect, useMemo } from 'react';
import NavBar from '../../components/navigation/NavBar';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import SearchBar from '../../components/search/SearchBar';
import DataTable from '../../components/tables/DataTable';
import ViewStudentRecordsComponent from '../../components/modals/ViewStudentRecordsComponent';
import { FaFolder, FaShieldAlt, FaUser, FaFileMedical, FaStethoscope } from 'react-icons/fa';
import FilterMedical from '../../components/buttons/FilterMedical';
import '../OfficeRecords.css';
import ViewRecordComponent from '../../components/modals/ViewRecordComponent';
import EditRecordComponent from '../../components/modals/EditRecordComponent';

const API_BASE_URL = process.env.REACT_APP_NODE_SERVER_URL || 'http://localhost:5000/';

const AdminINFRecords = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
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
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecordData, setEditRecordData] = useState(null);

  // Use default styling for admin view
  const getOfficeClass = () => "office-records-default";

  const getTitle = () => {
    return "Infirmary Medical Records (Admin View)";
  };

  const getFilterTitle = () => {
    switch (currentFilter) {
      case 'ALL': return "All Records";
      case 'MEDICALPSYCHOLOGICAL': return "Medical & Psychological Records (Both)";
      case 'MEDICAL': return "Medical Records Only";
      case 'PSYCHOLOGICAL': return "Psychological Records Only";
      default: return "Medical Records";
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

    setCurrentFilter(newFilter);

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

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  // Fetch all medical records (default view) - direct INF records
  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(false);

      const endpoint = `${API_BASE_URL}api/infirmary/medical-records?filter=${currentFilter}`;

      console.log('Fetching INF records with filter:', currentFilter, 'Endpoint:', endpoint);

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

  // Fetch students with medical records (search mode)
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);

      const endpoint = `${API_BASE_URL}api/student-medical-records?filter=${currentFilter}`;

      console.log('Fetching INF students with filter:', currentFilter, 'Endpoint:', endpoint);

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
      // If search is cleared, show default records view with current filter
      fetchAllRecords();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);

      const endpoint = `${API_BASE_URL}api/medical-records/search?query=${encodeURIComponent(query)}&filter=${currentFilter}`;

      console.log('Searching INF records with query:', query, 'Filter:', currentFilter, 'Endpoint:', endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStudents([]); // Clear students for now
        setRecords(data.records || []); // Show search results as individual records
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
  }, [currentFilter]);

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    refreshData();
  };

  const handleRowClick = (recordOrStudent) => {
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
      // Open ViewRecordComponent directly with the record
      setSelectedRecord(recordOrStudent);
      setShowViewModal(true);
    }
  };

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
            <h2><FaFolder /> {getFilterTitle()} {isSearchMode && searchQuery && `- Search: "${searchQuery}"`}</h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="admin-view-indicator" style={{ marginRight: '5px' }}>
              <span className="admin-badge">Read-Only Mode</span>
            </div>

            {!isSearchMode || !searchQuery ? (
              <FilterMedical
                type={viewType}
                onClick={cycleFilter}
                currentFilter={currentFilter}
              />
            ) : null}

            <SearchBar onSearch={handleSearch} placeholder="Search by ID, Name, or Strand" />
          </div>
        </div>
      </div>

      <div className="content">
        {isSearchMode ? (
          // Search mode: Show aggregated student table if we have student data, otherwise show individual records
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
            // Show search results as individual records
            <>
              {sortedRecords.length === 0 ? (
                <div className="empty-state">No records found matching your search.</div>
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
          )
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

export default AdminINFRecords;