// src/pages/MedicalCertificates.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/navigation/NavBar';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import SearchBar from '../components/search/SearchBar';
import DataTable from '../components/tables/DataTable';
import { FaFolder, FaShieldAlt, FaFilePdf, FaFileWord, FaFile, FaDownload } from 'react-icons/fa';
import './OfficeRecords.css'; // Use the same CSS as other office records pages

const API_BASE_URL = 'http://localhost:5000/';

const MedicalCertificates = ({ userData, onLogout, onNavItemClick, onExitViewAs }) => {
  const location = useLocation();
  const name = userData?.name || localStorage.getItem('userName') || 'User';
  const department = userData?.department || localStorage.getItem('userDepartment') || 'Unknown Department';
  const type = userData?.type || localStorage.getItem('type') || 'Unknown Type';
  const viewType = userData?.viewType || type;

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'uploadDate', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterUploader, setFilterUploader] = useState('ALL');

  const getOfficeClass = () => {
    switch (viewType) {
      case "OPD": return "office-records-opd";
      case "GCO": return "office-records-gco";
      case "INF": return "office-records-inf";
      default: return "office-records-default";
    }
  };

  // Column definitions for the DataTable
  const columns = [
    {
      key: 'caseNumber',
      label: 'Case Number',
      sortable: true,
      render: (value, row) => (
        <span className="case-number">#{row.recordId}</span>
      )
    },
    {
      key: 'student',
      label: 'Student Name',
      sortable: true,
      render: (value, row) => (
        <div className="student-info">
          <span className="student-name">{row.studentName}</span>
        </div>
      )
    },
    {
      key: 'studentId',
      label: 'ID Number',
      sortable: true,
      render: (value, row) => (
        <div className="student-info">
          <span className="student-id">{row.studentId}</span>
        </div>
      )
    },
    {
      key: 'fileName',
      label: 'File Name',
      sortable: true,
      render: (value, row) => {
        // Determine file icon based on mime type
        let FileIcon = FaFile;
        if (row.fileType?.includes('pdf')) {
          FileIcon = FaFilePdf;
        } else if (row.fileType?.includes('word') || row.fileType?.includes('document')) {
          FileIcon = FaFileWord;
        }

        return (
          <div className="file-name-cell">
       
            <a 
              href={`${API_BASE_URL}api/medical-certificates/download/${row.recordId}/${row.storedFileName}`}
              className="file-link"
              download
              onClick={(e) => e.stopPropagation()} // Prevent row click when clicking download
            >
              {row.fileName}
            </a>

          </div>
        );
      }
    },
    {
      key: 'uploadDate',
      label: 'Date',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    },
    {
      key: 'uploadedBy',
      label: 'Uploaded By',
      sortable: true,
      render: (value) => (
        <span className={`uploader-badge uploader-${value?.toLowerCase() || 'unknown'}`}>
          {value || 'Unknown'}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value, row) => {
        const types = [];
        if (row.isMedical) types.push('Medical');
        if (row.isPsychological) types.push('Psychological');
        return (
          <div className="type-badges">
            {types.map(type => (
              <span key={type} className={`type-badge type-${type.toLowerCase()}`}>
                {type}
              </span>
            ))}
          </div>
        );
      }
    }
  ];

  // Fetch all files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterType !== 'ALL') params.append('type', filterType);
      if (filterUploader !== 'ALL') params.append('uploadedBy', filterUploader);

      const url = `${API_BASE_URL}api/medical-certificates${params.toString() ? '?' + params.toString() : ''}`;
      
      console.log('Fetching medical certificates from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Fetched ${data.files?.length || 0} files`);
        setFiles(data.files || []);
      } else {
        throw new Error(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [filterType, filterUploader]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;

    const query = searchQuery.toLowerCase().trim();
    return files.filter(file => 
      file.studentName?.toLowerCase().includes(query) ||
      file.studentId?.toLowerCase().includes(query) ||
      file.fileName?.toLowerCase().includes(query) ||
      file.recordId?.toString().includes(query)
    );
  }, [files, searchQuery]);

  // Sort files based on sortConfig
  const sortedFiles = useMemo(() => {
    if (!sortConfig.key) return filteredFiles;

    return [...filteredFiles].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'caseNumber') {
        aValue = a.recordId;
        bValue = b.recordId;
      } else if (sortConfig.key === 'student') {
        aValue = a.studentName;
        bValue = b.studentName;
      } else if (sortConfig.key === 'type') {
        // Sort by the combination of medical/psychological types
        const aTypes = [];
        if (a.isMedical) aTypes.push('Medical');
        if (a.isPsychological) aTypes.push('Psychological');
        aValue = aTypes.sort().join(', ');
        
        const bTypes = [];
        if (b.isMedical) bTypes.push('Medical');
        if (b.isPsychological) bTypes.push('Psychological');
        bValue = bTypes.sort().join(', ');
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Handle dates
      if (sortConfig.key === 'uploadDate') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle numbers
      if (sortConfig.key === 'recordId') {
        const aNum = parseInt(aValue, 10);
        const bNum = parseInt(bValue, 10);
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
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
  }, [filteredFiles, sortConfig]);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const handleRowClick = (row) => {
    // Optional: Open file preview or show details
    console.log('Row clicked:', row);
    // You could open a modal with file details here
  };

  // Filter options
  const typeFilters = [
    { value: 'ALL', label: 'All Types' },
    { value: 'MEDICAL', label: 'Medical Only' },
    { value: 'PSYCHOLOGICAL', label: 'Psychological Only' }
  ];

  const uploaderFilters = [
    { value: 'ALL', label: 'All Uploaders' },
    { value: 'INF', label: 'Infirmary' },
    { value: 'OPD', label: 'OPD' },
  ];

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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaFolder /> Medical Certificates & Files
              <span className="file-count-badge">
                {sortedFiles.length} file{sortedFiles.length !== 1 ? 's' : ''}
              </span>
            </h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Type Filter Dropdown */}
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {typeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            {/* Uploader Filter Dropdown */}
            <select 
              className="filter-select"
              value={filterUploader}
              onChange={(e) => setFilterUploader(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {uploaderFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search by student name, ID, or filename..." 
            />
          </div>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading-state">Loading files...</div>
        ) : error ? (
          <div className="error-state">Error: {error}</div>
        ) : sortedFiles.length > 0 ? (
          <DataTable
            data={sortedFiles}
            columns={columns}
            type={viewType}
            onRowClick={handleRowClick}
            onSort={handleSort}
            sortConfig={sortConfig}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No files found</h3>
            <p>There are no medical certificates or files uploaded yet.</p>
            {(filterType !== 'ALL' || filterUploader !== 'ALL' || searchQuery) && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setFilterType('ALL');
                  setFilterUploader('ALL');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="footer">
        <div className="footer-header"><FaShieldAlt /> DATA PRIVACY CLOSURE</div>
        <div className="footer-text">
          To the extent permitted or required by law, we share, disclose, or transfer the information mentioned above with the permission of the data subjects to specific entities, organizations, or offices such as the Guidance and Counselling Office, the Office of the Prefect of Discipline, the Physical Education Department, and the Head Moderator. This is for the purpose of determining eligibility in academic competitions, eligibility in sports, exemptions from strenuous activities, as well as other similar events. All information provided is confidential and shall not be copied, shared, distributed, and used for any other purposes. We will use the collected data solely for our legitimate purposes and for the proper handling of records.
        </div>
      </div>
    </div>
  );
};

export default MedicalCertificates;