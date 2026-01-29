// src/components/modals/EditRecordComponent.js
import React, { useState, useEffect, useRef } from 'react';
import './AddRecordComponent.css';
import useStudentAutocomplete from '../../hooks/useStudentAutocomplete';
import OPDForm from '../forms/OPDForm';
import GCOForm from '../forms/GCOForm';
import INFForm from '../forms/INFForm';
import { detectRecordType } from '../../utils/recordTypeDetector';
import SuccessOverlay from '../common/SuccessOverlay';

const EditRecordComponent = ({ isOpen, onClose, onRecordUpdated, type, record }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    strand: '',
    gradeLevel: '',
    section: '',
    schoolYearSemester: '', // Added schoolYearSemester field
    // OPD fields
    violationLevel: '',
    status: '', // Single status field for all record types
    referToGCO: '', // OPD uses this
    generalDescription: '',
    additionalRemarks: '',
    // GCO fields
    sessionNumber: '',
    date: '',
    time: '',
    generalConcern: '',
    psychologicalCondition: 'NO',
    // INF fields
    subject: '',
    medicalDetails: '',
    isPsychological: '',
    isMedical: '',
    referredToGCO: '',
    // ADD uploaderType field:
    uploaderType: type // Set uploaderType to the current user type
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [fileClassifications, setFileClassifications] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastUpdatedRecord, setLastUpdatedRecord] = useState(null);

  const {
    studentSuggestions,
    showSuggestions,
    isLoading,
    fetchStudentSuggestions,
    clearSuggestions
  } = useStudentAutocomplete();

  // Determine record type
  const recordType = detectRecordType(record);
  const userType = type;

  // Helper function to format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';

    // Handle different date formats
    if (dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Helper function to format time for input field
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';

    // Handle different time formats
    if (timeString === '00:00:00.000000' || timeString === '00:00:00') return '';

    // Extract just the time part (HH:MM)
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
    }

    return timeString;
  };

  // Helper function to normalize status value
  const normalizeStatus = (status) => {
    if (!status) return '';

    // Convert database status to form status
    const statusMap = {
      'SCHEDULED': 'Scheduled',
      'TO SCHEDULE': 'To Schedule',
      'DONE': 'Done'
    };

    return statusMap[status] || status;
  };

  // Populate form when record changes - FIXED: Properly map INF referred field
  useEffect(() => {
    if (record) {
      console.log('Editing record data:', record);
      console.log('Record schoolYearSemester:', record.schoolYearSemester || record.cr_school_year_semester);
      console.log('Record referred field:', record.referred || record.mr_referred);

      // Determine the referred value based on record type
      let referredValue = '';
      if (recordType === "OPD") {
        referredValue = record.referred || record.mr_referred || '';
      } else if (recordType === "INF") {
        referredValue = record.referred || record.mr_referred || ''; // REMOVED DEFAULT 'No'
      }

      setFormData(prev => ({
        ...prev,
        studentId: record.id || record.cor_student_id_number || record.studentId || '',
        studentName: record.name || record.cor_student_name || record.studentName || '',
        strand: record.strand || record.cor_student_strand || '',
        gradeLevel: record.gradeLevel || record.cor_student_grade_level || '',
        section: record.section || record.cor_student_section || '',
        schoolYearSemester: record.schoolYearSemester || record.cr_school_year_semester || '', // ADDED THIS LINE

        // FIXED: Use normalized status for form
        status: normalizeStatus(record.cor_status || record.status || ''),

        // OPD fields
        violationLevel: record.violationLevel || record.cr_violation_level || '',
        referToGCO: recordType === "OPD" ? referredValue : '', // Only for OPD
        generalDescription: record.description || record.cr_description || '',
        additionalRemarks: record.remarks || record.mr_additional_remarks || record.cr_remarks || '',

        // GCO fields - FIXED: Use proper formatting
        sessionNumber: record.sessionNumber || record.cor_session_number || '',
        date: formatDateForInput(record.cor_date || record.date || ''),
        time: formatTimeForInput(record.cor_time || record.time || ''),
        generalConcern: record.concern || record.cor_general_concern || '',
        psychologicalCondition: record.psychologicalCondition || record.cor_is_psychological_condition || 'NO',

        // INF fields - FIXED: Properly map referredToGCO
        subject: record.subject || record.mr_subject || '',
        medicalDetails: record.medicalDetails || record.mr_medical_details || '',
        isPsychological: record.isPsychological || record.mr_is_psychological || '',
        isMedical: record.isMedical || record.mr_is_medical || '',
        referredToGCO: recordType === "INF" ? (record.mr_referred || record.referred || '') : '',

        
        // Set uploaderType to current user type
        uploaderType: type
      }));

      // Set existing files from record
      const files = record.attachments || record.files || [];
      console.log('Setting existing files:', files);
      setExistingFiles(files);
      setSelectedFiles([]); // Reset new files
      setFilesToDelete([]); // Reset files to delete
      setFileClassifications([]); // Reset file classifications
    }
  }, [record, type, recordType]);

  if (!isOpen || !record) return null;

  const getPrimaryColor = () => {
    switch (recordType) {
      case "OPD": return "#003A6C";
      case "GCO": return "#00451D";
      case "INF": return "#640C17";
      default: return "#0a1a3c";
    }
  };

  const getModalTitle = () => {
    switch (recordType) {
      case "OPD":
        return "Edit Case Record";
      case "GCO":
        return "Edit Counseling Record";
      case "INF":
        return "Edit Medical/Psychological Record";
      default:
        return "Edit Record";
    }
  };

  const getSuccessTitle = () => {
    switch (recordType) {
      case "OPD":
        return "Case Record Updated Successfully!";
      case "GCO":
        return "Counseling Record Updated Successfully!";
      case "INF":
        return "Medical Record Updated Successfully!";
      default:
        return "Record Updated Successfully!";
    }
  };

  const handleStudentIdChange = (value) => {
    setFormData(prev => ({
      ...prev,
      studentId: value
    }));
    fetchStudentSuggestions(value);
  };

  const handleStudentSelect = (student) => {
    console.log('Selected student in edit mode:', student); // Debug log
    setFormData(prev => ({
      ...prev,
      studentId: student.sd_id_number,
      studentName: student.sd_student_name,
      strand: student.sd_strand,
      gradeLevel: student.sd_grade_level,
      section: student.sd_section,
      schoolYearSemester: student.sd_school_year_semesterr || '' // FIXED: Added schoolYearSemester
    }));
    clearSuggestions();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
  };

  const handleFileClassifications = (classifications) => {
    console.log('File classifications received in edit:', classifications);
    // Ensure all classifications have required fields
    const completeClassifications = classifications.map(classification => ({
      ...classification,
      filename: classification.filename || classification.originalname || ''
    }));
    setFileClassifications(completeClassifications);
  };

  const handleRemoveExistingFile = (filename) => {
    setFilesToDelete(prev => [...prev, filename]);
    setExistingFiles(prev => prev.filter(file => file.filename !== filename));
  };

  const handleRemoveNewFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleUpdateOPDRecord = async () => {
    // Validate required fields for OPD
    if (!formData.studentId || !formData.studentName) {
      alert('Please select a student by entering a valid ID number');
      return;
    }

    if (!formData.violationLevel || !formData.status || !formData.referToGCO) {
      alert('Please fill in all required case details');
      return;
    }

    if (!formData.generalDescription) {
      alert('Please provide a general description');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all form data
      formDataToSend.append('studentId', formData.studentId);
      formDataToSend.append('studentName', formData.studentName);
      formDataToSend.append('strand', formData.strand);
      formDataToSend.append('gradeLevel', formData.gradeLevel);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('schoolYearSemester', formData.schoolYearSemester);
      formDataToSend.append('violationLevel', formData.violationLevel);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('description', formData.generalDescription);
      formDataToSend.append('remarks', formData.additionalRemarks);
      formDataToSend.append('referredToGCO', formData.referToGCO);

      // Append existing files that are not marked for deletion
      const remainingExistingFiles = existingFiles.filter(file =>
        !filesToDelete.includes(file.filename)
      );
      formDataToSend.append('existingAttachments', JSON.stringify(remainingExistingFiles));

      // Append files to delete
      filesToDelete.forEach(filename => {
        formDataToSend.append('filesToDelete', filename);
      });

      // Append new file if selected (only one file allowed for OPD)
      if (selectedFiles.length > 0) {
        formDataToSend.append('attachments', selectedFiles[0]);
      }

      const caseId = record.caseNo || record.cr_case_id;
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/case-records/${caseId}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        // Prepare updated record for UI
        const updatedRecord = {
          ...record,
          id: formData.studentId,
          name: formData.studentName,
          strand: formData.strand,
          gradeLevel: formData.gradeLevel,
          section: formData.section,
          schoolYearSemester: formData.schoolYearSemester,
          violationLevel: formData.violationLevel,
          status: formData.status,
          referred: formData.referToGCO,
          description: formData.generalDescription,
          remarks: formData.additionalRemarks,
          // Note: attachments will be updated by the parent component via refresh
        };

        setLastUpdatedRecord(updatedRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating case record:', error);
      alert(`Error updating record: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGCORecord = async () => {
    // Validate required fields for GCO
    if (!formData.studentId || !formData.studentName) {
      alert('Please select a student by entering a valid ID number');
      return;
    }

    if (!formData.sessionNumber || !formData.status || !formData.generalConcern) {
      alert('Please fill in all required schedule details');
      return;
    }

    // Only validate date and time if status is NOT "To Schedule"
    if (formData.status !== 'To Schedule' && (!formData.date || !formData.time)) {
      alert('Please fill in date and time when status is not "To Schedule"');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all form data
      formDataToSend.append('studentId', formData.studentId);
      formDataToSend.append('studentName', formData.studentName);
      formDataToSend.append('strand', formData.strand);
      formDataToSend.append('gradeLevel', formData.gradeLevel);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('schoolYearSemester', formData.schoolYearSemester || '');
      formDataToSend.append('sessionNumber', formData.sessionNumber);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('date', formData.date || '');
      formDataToSend.append('time', formData.time || '');
      formDataToSend.append('concern', formData.generalConcern);
      formDataToSend.append('remarks', formData.additionalRemarks || '');
      formDataToSend.append('psychologicalCondition', formData.psychologicalCondition);

      // Append existing files that are not marked for deletion
      const remainingExistingFiles = existingFiles.filter(file =>
        !filesToDelete.includes(file.filename)
      );

      if (remainingExistingFiles.length > 0) {
        formDataToSend.append('existingAttachments', JSON.stringify(remainingExistingFiles));
      }

      // Append files to delete
      filesToDelete.forEach(filename => {
        formDataToSend.append('filesToDelete', filename);
      });

      // Append new files (multiple files allowed for GCO)
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const recordId = record.recordId || record.cor_record_id;
      console.log('Updating GCO record ID:', recordId);
      console.log('Form data status:', formData.status);
      console.log('Date value:', formData.date);
      console.log('Time value:', formData.time);

      // Use environment variable for API base URL
      const API_BASE_URL = process.env.REACT_APP_NODE_SERVER_URL || 'https://ccmr-final-node-production.up.railway.app/';
      const response = await fetch(`${API_BASE_URL}api/counseling-records/${recordId}`, {
        method: 'PUT',
        body: formDataToSend,
        // Remove Content-Type header for FormData
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (result.success) {
        const updatedRecord = {
          ...record,
          id: formData.studentId,
          name: formData.studentName,
          strand: formData.strand,
          gradeLevel: formData.gradeLevel,
          section: formData.section,
          schoolYearSemester: formData.schoolYearSemester,
          sessionNumber: formData.sessionNumber,
          status: formData.status,
          date: formData.date,
          time: formData.time,
          concern: formData.generalConcern,
          remarks: formData.additionalRemarks,
          psychologicalCondition: formData.psychologicalCondition,
          attachments: [...remainingExistingFiles, ...selectedFiles.map(f => ({
            filename: f.name,
            originalname: f.name,
            mimetype: f.type,
            size: f.size
          }))]
        };

        setLastUpdatedRecord(updatedRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || result.error || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating counseling record:', error);
      alert(`Error updating record: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateINFRecord = async () => {
    // Validate required fields for INF
    if (!formData.studentId || !formData.studentName) {
      alert('Please select a student by entering a valid ID number');
      return;
    }

    if (!formData.subject || !formData.status) {
      alert('Please fill in subject and status');
      return;
    }

    if (!formData.medicalDetails) {
      alert('Please provide medical details');
      return;
    }

    if (!formData.isPsychological || !formData.isMedical) {
      alert('Please specify if this is a psychological or medical record');
      return;
    }

    // Check if both are set to "No"
    if (formData.isPsychological === 'No' && formData.isMedical === 'No') {
      alert('Record cannot be neither medical nor psychological');
      return;
    }

    // Validate file classifications
    const allFiles = [...existingFiles, ...selectedFiles];
    if (allFiles.length > 0) {
      const filesWithoutClassification = allFiles.filter(file => {
        const fileName = file.originalname || file.name;
        const classification = fileClassifications.find(c => c.filename === fileName);
        return !classification || (!classification.isMedical && !classification.isPsychological);
      });

      if (filesWithoutClassification.length > 0) {
        alert('Please specify whether file type is Medical/Psychological for all files');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all form data - FIXED: Use referredToGCO for INF
      formDataToSend.append('studentId', formData.studentId);
      formDataToSend.append('studentName', formData.studentName);
      formDataToSend.append('strand', formData.strand);
      formDataToSend.append('gradeLevel', formData.gradeLevel);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('schoolYearSemester', formData.schoolYearSemester || '');
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('medicalDetails', formData.medicalDetails);
      formDataToSend.append('remarks', formData.additionalRemarks || '');
      formDataToSend.append('referredToGCO', formData.referredToGCO === undefined ? '' : formData.referredToGCO);
      formDataToSend.append('isPsychological', formData.isPsychological);
      formDataToSend.append('isMedical', formData.isMedical);
      // CRITICAL: Add uploaderType to the form data
      formDataToSend.append('uploaderType', formData.uploaderType || type);

      // Prepare existing files with updated classifications
      const remainingExistingFiles = existingFiles
        .filter(file => !filesToDelete.includes(file.filename))
        .map(file => {
          const fileName = file.originalname || file.name;
          const classification = fileClassifications.find(c => c.filename === fileName) || {};
          return {
            ...file,
            isMedical: classification.isMedical || false,
            isPsychological: classification.isPsychological || false
          };
        });

      console.log('Remaining existing files with classifications:', remainingExistingFiles);

      if (remainingExistingFiles.length > 0) {
        formDataToSend.append('existingAttachments', JSON.stringify(remainingExistingFiles));
      }

      // Append files to delete
      if (filesToDelete.length > 0) {
        filesToDelete.forEach(filename => {
          formDataToSend.append('filesToDelete', filename);
        });
      }

      // Append new files (multiple files allowed for INF)
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      // Append file classifications for ALL files (existing and new)
      const allClassifications = [...remainingExistingFiles, ...selectedFiles].map(file => {
        const fileName = file.originalname || file.name;
        const classification = fileClassifications.find(c => c.filename === fileName) || {};
        return {
          filename: fileName,
          isMedical: classification.isMedical || false,
          isPsychological: classification.isPsychological || false
        };
      });

      console.log('All file classifications to send:', allClassifications);

      if (allClassifications.length > 0) {
        formDataToSend.append('fileClassifications', JSON.stringify(allClassifications));
      }

      const recordId = record.mr_medical_id || record.recordId;
      console.log('Updating INF record ID:', recordId);
      console.log('Uploader type being sent:', formData.uploaderType || type);
      console.log('referredToGCO being sent:', formData.referredToGCO); // Debug log

      const API_BASE_URL = process.env.REACT_APP_NODE_SERVER_URL || 'https://ccmr-final-node-production.up.railway.app/';
      const response = await fetch(`${API_BASE_URL}api/medical-records/${recordId}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (result.success) {
        const updatedRecord = {
          ...record,
          mr_student_id: formData.studentId,
          mr_student_name: formData.studentName,
          mr_student_strand: formData.strand,
          mr_grade_level: formData.gradeLevel,
          mr_section: formData.section,
          mr_school_year_semester: formData.schoolYearSemester,
          mr_subject: formData.subject,
          mr_status: formData.status,
          mr_medical_details: formData.medicalDetails,
          mr_additional_remarks: formData.additionalRemarks,
          mr_referred: formData.referredToGCO, // FIXED: Map to correct field
          mr_is_psychological: formData.isPsychological,
          mr_is_medical: formData.isMedical,
        };

        setLastUpdatedRecord(updatedRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || result.error || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      alert(`Error updating record: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRecord = () => {
    if (recordType === "OPD") {
      handleUpdateOPDRecord();
    } else if (recordType === "GCO") {
      handleUpdateGCORecord();
    } else if (recordType === "INF") {
      handleUpdateINFRecord();
    }
  };

  const handleSuccessView = () => {
    if (lastUpdatedRecord) {
      onRecordUpdated(lastUpdatedRecord);
    }
    setShowSuccess(false);
    onClose();
  };

  const handleSuccessExit = () => {
    if (lastUpdatedRecord) {
      onRecordUpdated(lastUpdatedRecord);
    }
    setShowSuccess(false);
    onClose();
  };

  const renderFormContent = () => {
    const commonProps = {
      formData,
      onInputChange: handleInputChange,
      onStudentIdChange: handleStudentIdChange,
      onStudentSelect: handleStudentSelect,
      studentSuggestions,
      showSuggestions,
      isLoading,
      primaryColor: getPrimaryColor(),
      onFilesSelected: handleFilesSelected,
      selectedFiles,
      existingFiles,
      onRemoveExistingFile: handleRemoveExistingFile,
      onRemoveNewFile: handleRemoveNewFile,
      onFileClassifications: handleFileClassifications,
      isEditMode: true,
      isDisabled: userType === "OPD" && recordType === "GCO",
      // PASS THE UPLOADER TYPE TO INFFORM
      uploaderType: formData.uploaderType || userType,
      userType: userType
    };

    switch (recordType) {
      case "OPD":
        return <OPDForm {...commonProps} />;
      case "GCO":
        return <GCOForm {...commonProps} />;
      case "INF":
        return <INFForm {...commonProps} />;
      default:
        return <p>Form content for {recordType}</p>;
    }
  };

  // Check if user has permission to edit this record
  const hasEditPermission = () => {
    // OPD users can edit OPD records AND INF records
    if (userType === "OPD") {
      return recordType === "OPD" || recordType === "INF";
    }

    // GCO users can edit GCO records AND OPD records (referred cases)
    if (userType === "GCO") {
      return recordType === "GCO" || recordType === "OPD";
    }

    // INF users can only edit INF records
    if (userType === "INF") {
      return recordType === "INF";
    }

    return false;
  };

  const canEdit = hasEditPermission();

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3 style={{ color: getPrimaryColor() }}>{getModalTitle()}</h3>
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            {!canEdit ? (
              <div className="permission-denied">
                <p>You don't have permission to edit {recordType} records.</p>
                <p>Your user type ({userType}) cannot edit {recordType} records.</p>
              </div>
            ) : (
              renderFormContent()
            )}
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            {canEdit && (
              <button
                className="btn primary"
                onClick={handleUpdateRecord}
                style={{ backgroundColor: getPrimaryColor(), borderColor: getPrimaryColor() }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Record'}
              </button>
            )}
          </div>
        </div>
      </div>

      <SuccessOverlay
        isVisible={showSuccess}
        title={getSuccessTitle()}
        onView={handleSuccessView}
        onExit={handleSuccessExit}
        viewButtonText="View Record"
        exitButtonText="Exit"
      />
    </>
  );
};

export default EditRecordComponent;