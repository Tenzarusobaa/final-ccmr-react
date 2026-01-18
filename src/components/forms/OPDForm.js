// src/components/forms/OPDForm.js
import React, { useRef } from 'react';
import StudentAutocomplete from '../common/StudentAutocomplete';
import './FormStyles.css';

const OPDForm = ({ 
  formData, 
  onInputChange, 
  onStudentIdChange, 
  onStudentSelect,
  studentSuggestions,
  showSuggestions,
  isLoading,
  primaryColor,
  onFilesSelected,
  selectedFiles,
  existingFiles = [],
  onRemoveExistingFile,
  onRemoveNewFile,
  isEditMode = false
}) => {
  const fileInputRef = useRef(null);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Filter only PDF and DOCX files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      alert('Only PDF and DOCX files are allowed. Other file types have been removed.');
    }
    
    // Only allow one file - take the first valid file
    if (validFiles.length > 0) {
      onFilesSelected([validFiles[0]]);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="form-container">
      <div className="form-sections-row">
        <div className="form-section">
          <h4 style={{ color: primaryColor }}>Student Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idNumber">ID Number *</label>
              <StudentAutocomplete
                value={formData.studentId}
                onChange={onStudentIdChange}
                onStudentSelect={onStudentSelect}
                studentSuggestions={studentSuggestions}
                showSuggestions={showSuggestions}
                isLoading={isLoading}
                placeholder="Enter ID Number"
                required={true}
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input 
                type="text" 
                id="name" 
                name="studentName"
                value={formData.studentName} 
                onChange={onInputChange}
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
                name="strand"
                value={formData.strand} 
                onChange={onInputChange}
                disabled 
              />
            </div>
            <div className="form-group">
              <label htmlFor="gradeLevel">Grade Level</label>
              <input 
                type="text" 
                id="gradeLevel" 
                name="gradeLevel"
                value={formData.gradeLevel} 
                onChange={onInputChange}
                disabled 
              />
            </div>
            <div className="form-group">
              <label htmlFor="section">Section</label>
              <input 
                type="text" 
                id="section" 
                name="section"
                value={formData.section} 
                onChange={onInputChange}
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
              name="violationLevel"
              value={formData.violationLevel} 
              onChange={onInputChange}
              required
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
              name="status"
              value={formData.status} 
              onChange={onInputChange}
              required
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
              name="referToGCO"
              value={formData.referToGCO} 
              onChange={onInputChange}
              required
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
            name="generalDescription"
            value={formData.generalDescription} 
            onChange={onInputChange}
            rows="4"
            placeholder="Enter detailed description of the case..."
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="additionalRemarks">Additional Remarks</label>
          <textarea 
            id="additionalRemarks" 
            name="additionalRemarks"
            value={formData.additionalRemarks} 
            onChange={onInputChange}
            rows="2"
            placeholder="Enter any additional remarks..."
          ></textarea>
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Attachments</h4>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx"
        />
        
        {/* Existing files in edit mode */}
        {isEditMode && existingFiles.length > 0 && (
          <div className="existing-files">
            <h5>Current File:</h5>
            {existingFiles.map((file, index) => (
              <div key={index} className="file-item existing">
                <span className="file-icon">
                  {getFileIcon(file.mimetype || file.type)}
                </span>
                <span className="file-name">{file.originalname || file.name}</span>
                <span className="file-size">
                  ({formatFileSize(file.size)})
                </span>
                <button 
                  type="button" 
                  className="remove-file-btn"
                  onClick={() => onRemoveExistingFile(file.filename)}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File upload area - only show if no file exists or in add mode 
        {(selectedFiles.length === 0 && (!isEditMode || existingFiles.length === 0)) && (
          <div 
            className="attachment-box" 
            style={{ borderColor: primaryColor }}
            onClick={handleAttachmentClick}
          >
            <div className="attachment-content">
              <p>Click to browse file</p>
              <small>Supported formats: PDF, DOC, DOCX (Max 1 file, 10MB)</small>
            </div>
          </div>
        )}

        */}
        
        {/* Selected new files */}
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h5>New File:</h5>
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item new">
                <span className="file-icon">
                  {getFileIcon(file.type)}
                </span>
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  ({formatFileSize(file.size)})
                </span>
                <button 
                  type="button" 
                  className="remove-file-btn"
                  onClick={onRemoveNewFile}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Show message when replacing file */}
        {isEditMode && existingFiles.length > 0 && selectedFiles.length > 0 && (
          <div className="file-replace-notice">
            <small>New file will replace the current file</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default OPDForm;