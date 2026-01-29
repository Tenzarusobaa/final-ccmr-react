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
  isDisabled = false,
  uploaderType = 'INF', // Pass the current user type
  // ADD THIS NEW PROP for user type:
  userType = 'INF' // Default to INF if not provided
}) => {
  const fileInputRef = useRef(null);
  const [validationError, setValidationError] = useState('');
  const [fileClassifications, setFileClassifications] = useState({});
  const [maxFilesError, setMaxFilesError] = useState('');
  // ADD THIS NEW STATE for file type validation
  const [fileTypeValidationError, setFileTypeValidationError] = useState('');
  const [hasInitializedClassifications, setHasInitializedClassifications] = useState(false);

  // Use userType instead of checking colors
  const isOPDUser = userType === "OPD";
  const isGCOUser = userType === "GCO";
  const isINFUser = userType === "INF";

  // Validate when isPsychological or isMedical changes
  useEffect(() => {
    if (formData.isPsychological === 'No' && formData.isMedical === 'No') {
      setValidationError('Record cannot be neither medical nor psychological');
    } else {
      setValidationError('');
    }
  }, [formData.isPsychological, formData.isMedical]);

  // Calculate remaining file slots
  const totalCurrentFiles = (isEditMode ? existingFiles.length : 0) + selectedFiles.length;
  const remainingSlots = 5 - totalCurrentFiles;

  // Validate max files
  useEffect(() => {
    if (totalCurrentFiles > 5) {
      setMaxFilesError(`Maximum 5 files allowed. You have ${totalCurrentFiles} files.`);
    } else {
      setMaxFilesError('');
    }
  }, [totalCurrentFiles]);

  // Validate file classifications when they change
  useEffect(() => {
    validateFileClassifications();
  }, [fileClassifications, selectedFiles, existingFiles]);

  // Pass file classifications to parent component when they change
  useEffect(() => {
    if (onFileClassifications) {
      // Get all classifications (both existing and new files)
      const allFiles = [
        ...existingFiles,
        ...selectedFiles.map(file => ({ 
          name: file.name, 
          originalname: file.name 
        }))
      ];
      
      const classifications = allFiles
        .map(file => {
          const fileName = file.originalname || file.name;
          return fileClassifications[fileName];
        })
        .filter(classification => 
          classification && classification.filename
        );
      
      console.log('Sending classifications to parent:', classifications);
      onFileClassifications(classifications);
    }
  }, [fileClassifications, onFileClassifications, existingFiles, selectedFiles]);

  // Initialize classifications for existing files in edit mode
  useEffect(() => {
    if (isEditMode && existingFiles.length > 0 && !hasInitializedClassifications) {
      console.log('Initializing classifications for existing files:', existingFiles);
      const existingClassifications = {};
      existingFiles.forEach(file => {
        const fileName = file.originalname || file.name;
        existingClassifications[fileName] = {
          filename: fileName,
          isMedical: file.isMedical === true || file.isMedical === 'true' || false,
          isPsychological: file.isPsychological === true || file.isPsychological === 'true' || false
        };
      });
      
      console.log('Initial classifications:', existingClassifications);
      setFileClassifications(prev => ({ ...prev, ...existingClassifications }));
      setHasInitializedClassifications(true);
    }
  }, [isEditMode, existingFiles, hasInitializedClassifications]);

  // NEW FUNCTION: Validate file classifications
  const validateFileClassifications = () => {
    // Get all files (existing + selected)
    const allFiles = [
      ...existingFiles.map(file => ({
        name: file.originalname || file.name,
        type: file.mimetype || file.type
      })),
      ...selectedFiles
    ];

    if (allFiles.length === 0) {
      setFileTypeValidationError('');
      return;
    }

    // Check if any file has no classification selected
    const filesWithoutClassification = allFiles.filter(file => {
      const fileName = file.name || file.originalname;
      const classification = fileClassifications[fileName];
      return !classification || (!classification.isMedical && !classification.isPsychological);
    });

    if (filesWithoutClassification.length > 0) {
      setFileTypeValidationError('Specify whether file type is Medical/Psychological for all files');
    } else {
      setFileTypeValidationError('');
    }
  };

  const handleAttachmentClick = () => {
    // Only prevent if truly disabled (GCO users editing INF records)
    if (isDisabled && remainingSlots <= 0) return;
    if (isDisabled && remainingSlots > 0) {
      // If disabled but has slots, check if it's GCO user
      if (isGCOUser && isEditMode) {
        // GCO user cannot edit INF records
        alert('GCO users cannot edit INF records');
        return;
      }
    }
    // OPD users can always upload files
    if (isOPDUser && isEditMode) {
      // OPD users can upload files even though other inputs are disabled
      fileInputRef.current?.click();
      return;
    }
    // INF users can always upload files
    if (isINFUser && isEditMode) {
      fileInputRef.current?.click();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    // Only prevent if truly disabled (GCO users editing INF records)
    if (isDisabled) {
      if (isGCOUser && isEditMode) {
        // GCO user cannot edit INF records
        alert('GCO users cannot edit INF records');
        return;
      }
    }
    
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
    const totalAfterAdd = totalCurrentFiles + validFiles.length;
    if (totalAfterAdd > 5) {
      alert(`Maximum 5 files allowed. You currently have ${totalCurrentFiles} files and tried to add ${validFiles.length} more. Please remove some files first.`);
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
      
      // Add new files to selected files
      onFilesSelected([...selectedFiles, ...validFiles]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNewFile = (index) => {
    // Only prevent if truly disabled (GCO users editing INF records)
    if (isDisabled && isGCOUser && isEditMode) {
      // GCO user cannot edit INF records
      alert('GCO users cannot edit INF records');
      return;
    }
    
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
    // Only prevent if truly disabled (GCO users editing INF records)
    if (isDisabled && isGCOUser && isEditMode) {
      // GCO user cannot edit INF records
      alert('GCO users cannot edit INF records');
      return;
    }
    
    console.log(`Changing classification for ${fileName}: ${field} = ${value}`);
    
    setFileClassifications(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value,
        filename: fileName // Ensure filename is always set
      }
    }));
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
                disabled={isDisabled || isOPDUser} // Disable for OPD users
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                disabled={true}
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
                value={formData.schoolYearSemester || formData.schoolYear || ''} 
                onChange={onInputChange}
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
              name="subject"
              value={formData.subject} 
              onChange={onInputChange}
              placeholder="Enter subject or concern"
              required
              disabled={isDisabled || isOPDUser} // Disable for OPD users
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
              disabled={isDisabled || isOPDUser} // Disable for OPD users
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
              //disabled={isDisabled || isOPDUser} // Disable for OPD users
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
                disabled={isDisabled || isOPDUser} // Disable for OPD users
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
                disabled={isDisabled || isOPDUser} // Disable for OPD users
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
            disabled={isDisabled || isOPDUser} // Disable for OPD users
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
            disabled={isDisabled || isOPDUser} // Disable for OPD users
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

        {maxFilesError && (
          <div className="max-files-notice" style={{color: '#e74c3c', marginBottom: '10px'}}>
            <small>{maxFilesError}</small>
          </div>
        )}

        {/* NEW: File type validation error message */}
        {fileTypeValidationError && (
          <div className="validation-error" style={{ marginBottom: '15px' }}>
            {fileTypeValidationError}
          </div>
        )}
        
        {/* Existing files in edit mode */}
        {isEditMode && existingFiles.length > 0 && (
          <div className="existing-files">
            <h5>Current Files:</h5>
            {existingFiles.map((file, index) => {
              const fileName = file.originalname || file.name;
              const classification = fileClassifications[fileName] || { 
                isMedical: file.isMedical === true || file.isMedical === 'true' || false, 
                isPsychological: file.isPsychological === true || file.isPsychological === 'true' || false 
              };
              
              console.log(`File ${fileName} classification:`, classification);
              
              return (
                <div key={index} className="file-item existing with-classification">
                  <div className="file-info">
                    <span className="file-icon">
                      {getFileIcon(file.mimetype || file.type)}
                    </span>
                    <span className="file-name">{fileName}</span>
                    <span className="file-size">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  
                  <div className="file-classification">
                    <label className="classification-checkbox">
                      <input
                        type="checkbox"
                        checked={classification.isMedical || false}
                        onChange={(e) => handleFileClassificationChange(fileName, 'isMedical', e.target.checked)}
                        disabled={isDisabled || isOPDUser} // Disable for OPD users
                        required
                      />
                      <span>Medical</span>
                    </label>
                    
                    <label className="classification-checkbox">
                      <input
                        type="checkbox"
                        checked={classification.isPsychological || false}
                        onChange={(e) => handleFileClassificationChange(fileName, 'isPsychological', e.target.checked)}
                        disabled={isDisabled || isOPDUser} // Disable for OPD users
                        required
                      />
                      <span>Psychological</span>
                    </label>
                  </div>
                  
                  <button 
                    type="button" 
                    className="remove-file-btn"
                    onClick={() => onRemoveExistingFile(file.filename)}
                    title="Remove file"
                    disabled={isDisabled || isOPDUser} // Disable for OPD users
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* OPD users can still upload files even if other inputs are disabled */}
        {remainingSlots > 0 && !(isDisabled && isGCOUser) && (
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
          
                      />
                      <span>Medical</span>
                    </label>
                    
                    <label className="classification-checkbox">
                      <input
                        type="checkbox"
                        checked={classification.isPsychological || false}
                        onChange={(e) => handleFileClassificationChange(file.name, 'isPsychological', e.target.checked)}
                    
                      />
                      <span>Psychological</span>
                    </label>
                  </div>
                  
                  <button 
                    type="button" 
                    className="remove-file-btn"
                    onClick={() => handleRemoveNewFile(index)}
                    title="Remove file"
                
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