// src/components/forms/OPDFormView.js
import React from 'react';
import './ViewFormStyles.css';

const OPDFormView = ({ record, primaryColor }) => {
  const handleDownload = (file) => {
    // Construct the correct download URL for case records
    const caseId = record.caseNo || record.cr_case_id;
    const filename = file.filename;

    if (caseId && filename) {
      const downloadUrl = `https://ccmr-final-node-production.up.railway.app/api/case-records/${caseId}/files/${filename}`;
      window.open(downloadUrl, '_blank');
    } else {
      console.error('Missing caseId or filename for download');
      alert('Unable to download file: missing information');
    }
  };

  const getFileIcon = (fileType, fileName = '') => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📃';
    // Fallback based on file extension
    if (fileName.toLowerCase().endsWith('.pdf')) return '📄';
    if (fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getFileTypeText = (fileType, fileName = '') => {
    if (fileType === 'application/pdf') return 'PDF Document';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word Document';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('text')) return 'Text File';
    // Fallback based on file extension
    if (fileName.toLowerCase().endsWith('.pdf')) return 'PDF Document';
    if (fileName.toLowerCase().endsWith('.doc')) return 'Word Document';
    if (fileName.toLowerCase().endsWith('.docx')) return 'Word Document';
    return 'File';
  };

  // Get attachments from record - handle different property names
  const attachments = record.attachments || record.files || [];

  return (
    <div className="form-container">
      <div className="form-sections-row">
        <div className="form-section">
          <h4 style={{ color: primaryColor }}>Student Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idNumber">ID Number *</label>
              <input
                type="text"
                id="idNumber"
                value={record.id || record.studentId || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={record.name || record.studentName || ''}
                disabled
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="strand">Strand</label>
              <input
                type="text"
                id="strand"
                value={record.strand || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="gradeLevel">Grade Level</label>
              <input
                type="text"
                id="gradeLevel"
                value={record.gradeLevel || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="section">Section</label>
              <input
                type="text"
                id="section"
                value={record.section || ''}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 style={{ color: primaryColor }}>Case Details *</h4>
          <div className="form-group">
            <label htmlFor="violationLevel">Violation Level *</label>
            <select
              id="violationLevel"
              value={record.violationLevel || ''}
              disabled
            >
              <option value="">-</option>
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Serious">Serious</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              value={record.status || ''}
              disabled
            >
              <option value="">-</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="referToGCO">Refer to GCO? *</label>
            <select
              id="referToGCO"
              value={record.referred || record.referToGCO || ''}
              disabled
            >
              <option value="">-</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Description *</h4>
        <div className="form-group">
          <label htmlFor="generalDescription">General Description *</label>
          <textarea
            id="generalDescription"
            value={record.description || record.generalDescription || ''}
            rows="4"
            disabled
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="additionalRemarks">Additional Remarks</label>
          <textarea
            id="additionalRemarks"
            value={record.remarks || record.additionalRemarks || ''}
            rows="2"
            disabled
          ></textarea>
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Attachments</h4>
        {attachments.length > 0 ? (
          <div className="attachments-list">
            {attachments.map((file, index) => {
              const fileName = file.originalname || file.name || 'Unknown File'; // Use originalname for display
              const fileType = file.type || file.mimetype || '';
              const fileSize = file.size;

              return (
                <div
                  key={index}
                  className="file-item-view"
                  onClick={() => handleDownload(file)}
                  style={{ cursor: 'pointer', borderLeftColor: primaryColor }}
                >
                  <div className="file-icon-view">
                    {getFileIcon(fileType, fileName)}
                  </div>
                  <div className="file-info-view">
                    <div className="file-name-view">{fileName}</div> {/* Display original name */}
                    <div className="file-details-view">
                      <span className="file-type">{getFileTypeText(fileType, fileName)}</span>
                      {fileSize && (
                        <span className="file-size"> • {formatFileSize(fileSize)}</span>
                      )}
                    </div>
                  </div>
                  <div className="file-action-view">
                    <button
                      className="download-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                      title="Download file"
                    >
                      ⬇️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-attachments">
            <p>No attachments available for this record.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OPDFormView;