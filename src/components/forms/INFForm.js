// src/components/forms/INFForm.js
import React, { useRef, useState, useEffect } from 'react';
import StudentAutocomplete from '../common/StudentAutocomplete';
import './FormStyles.css';

const INFForm = ({ 
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
  onFileClassifications,
  isEditMode = false,
  isDisabled = false // NEW: Disable form fields for OPD users
}) => {
  const fileInputRef = useRef(null);
  const [validationError, setValidationError] = useState('');
  const [fileClassifications, setFileClassifications] = useState({});

  // Validate when isPsychological or isMedical changes
  useEffect(() => {
    if (formData.isPsychological === 'No' && formData.isMedical === 'No') {
      setValidationError('Record cannot be neither medical nor psychological');
    } else {
      setValidationError('');
    }
  }, [formData.isPsychological, formData.isMedical]);

  // Pass file classifications to parent component when they change
  useEffect(() => {
    if (onFileClassifications) {
      const classifications = Object.values(fileClassifications).filter(classification => 
        classification && classification.filename
      );
      onFileClassifications(classifications);
    }
  }, [fileClassifications, onFileClassifications]);

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
    
    // Check total file count (existing + new)
    const totalFiles = (isEditMode ? existingFiles.length : 0) + validFiles.length;
    if (totalFiles > 5) {
      alert(`Maximum 5 files allowed. You currently have ${isEditMode ? existingFiles.length : 0} files and tried to add ${validFiles.length} more. Please remove some files first.`);
      return;
    }
    
    if (validFiles.length > 0) {
      // Initialize classifications for new files
      const newClassifications = {};
      validFiles.forEach(file => {
        newClassifications[file.name] = {
          isMedical: false,
          isPsychological: false,
          filename: file.name
        };
      });
      
      setFileClassifications(prev => ({
        ...prev,
        ...newClassifications
      }));
      
      onFilesSelected(validFiles);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    const fileToRemove = selectedFiles[index];
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    
    // Remove classification for deleted file
    setFileClassifications(prev => {
      const newClassifications = { ...prev };
      delete newClassifications[fileToRemove.name];
      return newClassifications;
    });
    
    onFilesSelected(newFiles);
  };

  const handleFileClassificationChange = (fileName, field, value) => {
    setFileClassifications(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value
      }
    }));
  };

  // Get file classifications for form submission
  const getFileClassifications = () => {
    return Object.values(fileClassifications).filter(classification => 
      classification && classification.filename
    );
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

  // Calculate remaining file slots
  const remainingSlots = 5 - (selectedFiles.length + (isEditMode ? existingFiles.length : 0));

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
                disabled={isDisabled} // NEW: Disable for OPD users
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
                disabled={true || isDisabled} // Always disabled + OPD restriction
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
                disabled={true || isDisabled} // Always disabled + OPD restriction
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
                disabled={true || isDisabled} // Always disabled + OPD restriction
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
                disabled={true || isDisabled} // Always disabled + OPD restriction
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
              name="subject"
              value={formData.subject} 
              onChange={onInputChange}
              placeholder="Enter subject or concern"
              required
              disabled={isDisabled} // NEW: Disable for OPD users
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select 
              id="status" 
              name="status"
              value={formData.status} 
              onChange={onInputChange}
              required
              disabled={isDisabled} // NEW: Disable for OPD users
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
              name="referredToGCO"
              value={formData.referredToGCO} 
              onChange={onInputChange}
              required
              disabled={isDisabled} // NEW: Disable for OPD users
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="isPsychological">Is Psychological? *</label>
              <select 
                id="isPsychological" 
                name="isPsychological"
                value={formData.isPsychological} 
                onChange={onInputChange}
                required
                disabled={isDisabled} // NEW: Disable for OPD users
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
                name="isMedical"
                value={formData.isMedical} 
                onChange={onInputChange}
                required
                disabled={isDisabled} // NEW: Disable for OPD users
              >
                <option value="">-</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
          
          {/* Validation Error Message */}
          {validationError && (
            <div className="validation-error">
              {validationError}
            </div>
          )}
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Medical Details *</h4>
        <div className="form-group">
          <label htmlFor="medicalDetails">Medical Details *</label>
          <textarea 
            id="medicalDetails" 
            name="medicalDetails"
            value={formData.medicalDetails} 
            onChange={onInputChange}
            rows="4"
            placeholder="Enter detailed medical/psychological information..."
            required
            disabled={isDisabled} // NEW: Disable for OPD users
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
            disabled={isDisabled} // NEW: Disable for OPD users
          ></textarea>
        </div>
      </div>

      <div className="form-section-full">
        <h4 style={{ color: primaryColor }}>Attachments</h4>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx"
        />
        
        {/* File upload info */}
        <div className="file-upload-info">
          <p><strong>Maximum 5 files allowed</strong> (PDF, DOC, DOCX only, 10MB each)</p>
          <p>Remaining file slots: <strong>{remainingSlots}</strong></p>
        </div>
        
        {/* Existing files in edit mode */}
        {isEditMode && existingFiles.length > 0 && (
          <div className="existing-files">
            <h5>Current Files:</h5>
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
                  disabled={isDisabled} // NEW: Disable for OPD users
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File upload area - ALWAYS ENABLED even for OPD users 
        {remainingSlots > 0 && (
          <div 
            className="attachment-box" 
            style={{ borderColor: primaryColor }}
            onClick={handleAttachmentClick}
          >
            <div className="attachment-content">
              <p>Click to browse files</p>
              <small>Supported formats: PDF, DOC, DOCX (Max 5 files total, 10MB each)</small>
              <small>Remaining slots: {remainingSlots}</small>
            </div>
          </div>
        )}

        */}
        
        {/* Selected new files with classification checkboxes */}
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h5>New Files to Upload:</h5>
            {selectedFiles.map((file, index) => {
              const classification = fileClassifications[file.name] || { isMedical: false, isPsychological: false };
              
              return (
                <div key={index} className="file-item new with-classification">
                  <div className="file-info">
                    <span className="file-icon">
                      {getFileIcon(file.type)}
                    </span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  
                  <div className="file-classification">
                    <label className="classification-checkbox">
                      <input
                        type="checkbox"
                        checked={classification.isMedical || false}
                        onChange={(e) => handleFileClassificationChange(file.name, 'isMedical', e.target.checked)}
                        disabled={isDisabled} // NEW: Disable for OPD users
                      />
                      <span>Medical</span>
                    </label>
                    
                    <label className="classification-checkbox">
                      <input
                        type="checkbox"
                        checked={classification.isPsychological || false}
                        onChange={(e) => handleFileClassificationChange(file.name, 'isPsychological', e.target.checked)}
                        disabled={isDisabled} // NEW: Disable for OPD users
                      />
                      <span>Psychological</span>
                    </label>
                  </div>
                  
                  <button 
                    type="button" 
                    className="remove-file-btn"
                    onClick={() => onRemoveNewFile(index)}
                    title="Remove file"
                    disabled={isDisabled} // NEW: Disable for OPD users
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Show message when adding files in edit mode */}
        {isEditMode && existingFiles.length > 0 && selectedFiles.length > 0 && (
          <div className="file-replace-notice">
            <small>New files will be added to the current files</small>
          </div>
        )}

        {/* Show message when maximum files reached */}
        {remainingSlots <= 0 && (
          <div className="max-files-notice">
            <small style={{color: '#e74c3c'}}>Maximum file limit reached (5 files). Remove some files to add new ones.</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default INFForm;