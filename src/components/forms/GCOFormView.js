// src/components/forms/GCOFormView.js
import React from 'react';
import './ViewFormStyles.css';

const GCOFormView = ({ record, primaryColor }) => {
  // Enhanced date formatting function
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Handle different date formats including '0000-00-00' from database
    if (dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Enhanced time formatting function
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    
    // Handle different time formats including database time format
    if (timeString === '00:00:00.000000' || timeString === '00:00:00') return '';
    
    // Extract just the time part (HH:MM)
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    return timeString;
  };

  const handleDownload = (file) => {
    // Construct the correct download URL for counseling records
    const recordId = record.recordId || record.cor_record_id;
    const filename = file.filename || file.originalname;
    
    if (recordId && filename) {
      const downloadUrl = `https://ccmr-final-node-production.up.railway.app/api/counseling-records/${recordId}/files/${filename}`;
      window.open(downloadUrl, '_blank');
    } else {
      console.error('Missing recordId or filename for download');
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
  const attachments = record.attachments || record.cor_attachments || [];

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
                value={record.cor_student_id_number || record.studentId || record.id || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={record.cor_student_name || record.studentName || record.name || ''}
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
                value={record.cor_student_strand || record.strand || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="gradeLevel">Grade Level</label>
              <input
                type="text"
                id="gradeLevel"
                value={record.cor_student_grade_level || record.gradeLevel || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="section">Section</label>
              <input
                type="text"
                id="section"
                value={record.cor_student_section || record.section || ''}
                disabled
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4 style={{ color: primaryColor }}>Schedule *</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sessionNumber">Session Number *</label>
              <input
                type="text"
                id="sessionNumber"
                value={record.cor_session_number || record.sessionNumber || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={record.cor_status || record.status || ''}
                disabled
              >
                <option value="">-</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="TO SCHEDULE">To Schedule</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                value={formatDateForInput(record.cor_date || record.date || '')}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">Time *</label>
              <input
                type="time"
                id="time"
                value={formatTimeForInput(record.cor_time || record.time || '')}
                disabled
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="psychologicalCondition">Is Psychological? *</label>
            <select
              id="psychologicalCondition"
              value={record.cor_is_psychological_condition || record.psychologicalCondition || 'NO'}
              disabled
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
              <option value="UNCONFIRMED">Unconfirmed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Concern *</h4>
        <div className="form-group">
          <label htmlFor="generalConcern">General Concern *</label>
          <textarea
            id="generalConcern"
            value={record.cor_general_concern || record.generalConcern || record.concern || ''}
            rows="4"
            disabled
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="additionalRemarks">Additional Remarks</label>
          <textarea
            id="additionalRemarks"
            value={record.cor_additional_remarks || record.additionalRemarks || record.remarks || ''}
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
              const fileName = file.originalname || file.name || 'Unknown File';
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
                    <div className="file-name-view">{fileName}</div>
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

export default GCOFormView;