import React, { useState, useEffect, useRef, useMemo } from 'react';
import NavBar from '../components/navigation/NavBar';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import AddButton from '../components/buttons/AddButton';
import ImportButton from '../components/buttons/ImportButton';
import SearchBar from '../components/search/SearchBar';
import DataTable from '../components/tables/DataTable';
import AddRecordComponent from '../components/modals/AddRecordComponent';
import { FaUser, FaShieldAlt } from 'react-icons/fa';
import './OfficeRecords.css';
import DemoOverlay from './DemoOverlay';

const StudentData = ({ userData, onLogout, onNavItemClick }) => {
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Unknown Department';
  const type = userData?.type || localStorage.getItem('type') || 'Unknown Type';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({
    strand: '',
    gradeLevel: '',
    gender: ''
  });
  const fileInputRef = useRef(null);

  const API_BASE = "https://ccmr-final-node-production.up.railway.app/api";
  const PYTHON_BASE = "http://localhost:5001/api";

  const getOfficeClass = () => {
    switch (type) {
      case "OPD": return "office-records-opd";
      case "GCO": return "office-records-gco";
      case "INF": return "office-records-inf";
      default: return "office-records-default";
    }
  };

  const getTitle = () => {
    return "Student Data Records";
  };

  // Make columns sortable
  const studentColumns = [
    { key: 'id', label: 'ID Number', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'strand', label: 'Strand', sortable: true },
    { key: 'gradeLevel', label: 'Grade Level', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'gender', label: 'Gender', sortable: true }
  ];

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    return {
      strands: [...new Set(students.map(student => student.strand).filter(Boolean))],
      gradeLevels: [...new Set(students.map(student => student.gradeLevel).filter(Boolean))],
      genders: [...new Set(students.map(student => student.gender).filter(Boolean))]
    };
  }, [students]);

  // Apply filters and sorting
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      return (
        (!filterConfig.strand || student.strand === filterConfig.strand) &&
        (!filterConfig.gradeLevel || student.gradeLevel === filterConfig.gradeLevel) &&
        (!filterConfig.gender || student.gender === filterConfig.gender)
      );
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
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

        // For numbers and other types
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [students, filterConfig, sortConfig]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/student-data`);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        throw new Error(data.error || 'Failed to fetch student data');
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      fetchStudents();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/student-data/search?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching student data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (sortConfig) => {
    setSortConfig(sortConfig);
  };

  const handleFilterChange = (filterType, value) => {
    setFilterConfig(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilterConfig({
      strand: '',
      gradeLevel: '',
      gender: ''
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      alert('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 10MB.');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${PYTHON_BASE}/import-students`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Import failed with status: ${response.status}`);
      }

      let message = `✅ Import successful!\n\nTotal: ${data.summary.total_records}\nImported: ${data.summary.successful_imports}\nFailed: ${data.summary.failed_imports}`;
      if (data.errors) {
        message += `\n\nFirst few errors:\n${data.errors.join('\n')}`;
      }
      alert(message);

      fetchStudents(); // Refresh data after import
    } catch (err) {
      console.error('Error importing file:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddRecord = () => setShowAddModal(true);
  const handleCloseModal = () => setShowAddModal(false);

  const handleRowClick = (student) => {
    console.log('Student clicked:', student);
  };

  if (loading && students.length === 0) {
    return (
      <div className={`office-records-container ${getOfficeClass()}`}>
        {/* <DemoOverlay /> */}
        <NavBar userDepartment={department} userType={type} userName={name} onLogout={onLogout} onNavItemClick={onNavItemClick} />
        <div className="office-records-header">
          <Breadcrumbs />
          <hr />
          <h2><FaUser /> {getTitle()}</h2>
        </div>
        <div className="content">
          <div className="loading-state">Loading student data...</div>
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
        <Breadcrumbs />
        <hr />
        <div className="header-flex">
          <div className="header-left">
            <h2><FaUser /> {getTitle()}</h2>
            {loading && <div className="loading-indicator">Updating...</div>}
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            {type === "OPD" && (
              <>
                <ImportButton
                  onClick={handleImportClick}
                  type={type}
                  label={importLoading ? "Importing..." : "Import"}
                  disabled={importLoading}
                />
              </>
            )}
            <SearchBar onSearch={handleSearch} disabled={loading} />
          </div>
        </div>
      </div>

      <div className="content">
        {error && (
          <div className="error-banner">
            Error: {error}
            <button onClick={fetchStudents} className="retry-button-small">
              Retry
            </button>
          </div>
        )}
        <DataTable
          data={filteredAndSortedStudents}
          columns={studentColumns}
          type={type}
          onRowClick={handleRowClick}
          onSort={handleSort}
          sortConfig={sortConfig}
          loading={loading}
        />
        {filteredAndSortedStudents.length === 0 && !loading && (
          <div className="no-data">No student records found.</div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
      />

      <AddRecordComponent isOpen={showAddModal} onClose={handleCloseModal} type={type} />

      <div className="footer">
        <div className="footer-header"><FaShieldAlt /> DATA PRIVACY CLOSURE</div>
        <div className="footer-text">
          To the extent permitted or required by law, we share, disclose, or transfer the information mentioned above with the permission of the data subjects to specific entities, organizations, or offices such as the Guidance and Counselling Office, the Office of the Prefect of Discipline, the Physical Education Department, and the Head Moderator. This is for the purpose of determining eligibility in academic competitions, eligibility in sports, exemptions from strenuous activities, as well as other similar events. All information provided is confidential and shall not be copied, shared, distributed, and used for any other purposes. We will use the collected data solely for our legitimate purposes and for the proper handling of records.
        </div>
      </div>
    </div>
  );
};

export default StudentData;