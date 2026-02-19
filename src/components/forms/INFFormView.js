// src/components/forms/INFFormView.js
import React from 'react';
import './ViewFormStyles.css';

const INFFormView = ({ record, primaryColor }) => {
  const handleDownload = (file) => {
    // Construct the correct download URL for medical records
    const recordId = record.recordId || record.mr_medical_id;
    const filename = file.filename;

    if (recordId && filename) {
      const downloadUrl = `https//localhost:5000/api/medical-records/${recordId}/files/${filename}`;
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get attachments from record - handle different property names
  const attachments = record.attachments || record.mr_attachments || [];

  // Get edit history
  const editHistory = record.editDate || [];

  // Debug: Log the record to see all properties
  console.log('INFFormView - Record data:', record);
  console.log('INFFormView - Referred value:', record.referred);

  // Helper function to get the referred value from any possible property name
  const getReferredValue = () => {
    // Check all possible property names for the referral status
    const possibleNames = [
      'referred',
      'mr_referred',
      'referredToGCO',
      'mr_referred_to_gco'
    ];
    
    for (const name of possibleNames) {
      if (record[name] !== undefined) {
        console.log(`Found referral at ${name}: ${record[name]}`);
        return record[name];
      }
    }
    
    // If not found, check if it might be in a nested object
    if (record.record && record.record.referred !== undefined) {
      return record.record.referred;
    }
    
    return '';
  };

  const referredValue = getReferredValue();

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
                value={record.id || record.mr_student_id || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={record.name || record.mr_student_name || ''}
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
                value={record.strand || record.mr_student_strand || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="gradeLevel">Grade Level</label>
              <input
                type="text"
                id="gradeLevel"
                value={record.gradeLevel || record.mr_grade_level || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="section">Section</label>
              <input
                type="text"
                id="section"
                value={record.section || record.mr_section || ''}
                disabled
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="schoolYearSemester">School Year & Semester</label>
              <input
                type="text"
                id="schoolYearSemester"
                name="schoolYearSemester"
                value={record?.schoolYearSemester || record?.schoolYear || ''}
                disabled={true}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 style={{ color: primaryColor }}>Record Details *</h4>
          <div className="form-group">
            <label htmlFor="subject">Subject/Concern *</label>
            <input
              type="text"
              id="subject"
              value={record.subject || record.mr_subject || ''}
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              value={record.status || record.mr_status || ''}
              disabled
            >
              <option value="">- Select Status -</option>
              <option value="Ongoing">Ongoing</option>
              <option value="For Treatment">For Treatment</option>
              <option value="Treated">Treated</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="referredToGCO">Refer to GCO? *</label>
            <select
              id="referredToGCO"
              value={referredValue}
              disabled
            >
              <option value="">- Select -</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="isPsychological">Is Psychological? *</label>
              <select
                id="isPsychological"
                value={record.isPsychological || record.mr_is_psychological || ''}
                disabled
              >
                <option value="">-</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="isMedical">Is Medical? *</label>
              <select
                id="isMedical"
                value={record.isMedical || record.mr_is_medical || ''}
                disabled
              >
                <option value="">-</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Medical Details *</h4>
        <div className="form-group">
          <label htmlFor="medicalDetails">Medical Details *</label>
          <textarea
            id="medicalDetails"
            value={record.medicalDetails || record.mr_medical_details || ''}
            rows="4"
            disabled
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="additionalRemarks">Additional Remarks</label>
          <textarea
            id="additionalRemarks"
            value={record.remarks || record.mr_additional_remarks || ''}
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
                      {file.uploadedBy && (
                        <span className="file-uploaded-by"> • Uploaded by: {file.uploadedBy}</span>
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

      {/* Edit History Section */}
      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Edit History</h4>
        {editHistory.length > 0 ? (
          <div className="edit-history-list">
            <table className="edit-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: `2px solid ${primaryColor}` }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: `2px solid ${primaryColor}` }}>Edited By</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: `2px solid ${primaryColor}` }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {editHistory.map((edit, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{index + 1}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      <span style={{ 
                        backgroundColor: edit.editedBy === 'OPD' ? '#003A6C' : 
                                       edit.editedBy === 'GCO' ? '#00451D' : '#640C17',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        {edit.editedBy}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      {formatDate(edit.editedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="create-date-info" style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
              <strong>Created:</strong> {formatDate(record.createDate)}
            </div>
          </div>
        ) : (
          <div className="no-edit-history">
            <p>No edit history available for this record.</p>
            <div className="create-date-info" style={{ fontSize: '0.9rem', color: '#666' }}>
              <strong>Created:</strong> {formatDate(record.createDate)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default INFFormView;