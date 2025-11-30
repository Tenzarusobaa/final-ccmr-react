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
    // OPD fields
    violationLevel: '',
    status: '', // Single status field for all record types
    referToGCO: '',
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
    referredToGCO: 'No'
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

  // Populate form when record changes
  useEffect(() => {
    if (record) {
      setFormData(prev => ({
        ...prev,
        studentId: record.id || record.mr_student_id || record.studentId || '',
        studentName: record.name || record.mr_student_name || record.studentName || '',
        strand: record.strand || record.mr_student_strand || '',
        gradeLevel: record.gradeLevel || record.mr_grade_level || '',
        section: record.section || record.mr_section || '',
        
        // Use specific status fields for each record type
        status: record.cr_status || record.mr_status || record.status || '',
        
        // OPD fields
        violationLevel: record.violationLevel || record.cr_violation_level || '',
        referToGCO: record.referred || record.mr_referred || record.referredToGCO || '',
        generalDescription: record.description || record.cr_description || '',
        additionalRemarks: record.remarks || record.mr_additional_remarks || record.cr_remarks || '',
        
        // GCO fields
        sessionNumber: record.sessionNumber || record.cr_session_number || '',
        date: record.date || record.cr_date || '',
        time: record.time || record.cr_time || '',
        generalConcern: record.concern || record.cr_concern || '',
        psychologicalCondition: record.psychologicalCondition || record.cr_psychological_condition || 'NO',
        
        // INF fields
        subject: record.subject || record.mr_subject || '',
        medicalDetails: record.medicalDetails || record.mr_medical_details || '',
        isPsychological: record.isPsychological || record.mr_is_psychological || '',
        isMedical: record.isMedical || record.mr_is_medical || '',
        referredToGCO: record.referred || record.mr_referred || 'No'
      }));

      // Set existing files from record
      const files = record.attachments || record.files || [];
      setExistingFiles(files);
      setSelectedFiles([]); // Reset new files
      setFilesToDelete([]); // Reset files to delete
      setFileClassifications([]); // Reset file classifications
    }
  }, [record]);

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
    setFormData(prev => ({
      ...prev,
      studentId: student.sd_id_number,
      studentName: student.sd_student_name,
      strand: student.sd_strand,
      gradeLevel: student.sd_grade_level,
      section: student.sd_section
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
    setFileClassifications(classifications);
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
        // Prepare updated attachments for UI
        const updatedAttachments = [
          ...remainingExistingFiles,
          ...(selectedFiles.length > 0 ? [{
            filename: selectedFiles[0].name, // This will be updated by the server
            originalname: selectedFiles[0].name,
            size: selectedFiles[0].size,
            type: selectedFiles[0].type
          }] : [])
        ];

        const updatedRecord = {
          ...record,
          id: formData.studentId,
          name: formData.studentName,
          strand: formData.strand,
          gradeLevel: formData.gradeLevel,
          section: formData.section,
          violationLevel: formData.violationLevel,
          status: formData.status,
          referred: formData.referToGCO,
          description: formData.generalDescription,
          remarks: formData.additionalRemarks,
          attachments: updatedAttachments
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

    if (!formData.sessionNumber || !formData.status || !formData.date || !formData.time || !formData.generalConcern) {
      alert('Please fill in all required schedule details');
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
      formDataToSend.append('sessionNumber', formData.sessionNumber);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('concern', formData.generalConcern);
      formDataToSend.append('remarks', formData.additionalRemarks);
      formDataToSend.append('psychologicalCondition', formData.psychologicalCondition);

      // Append existing files that are not marked for deletion
      const remainingExistingFiles = existingFiles.filter(file => 
        !filesToDelete.includes(file.filename)
      );
      formDataToSend.append('existingAttachments', JSON.stringify(remainingExistingFiles));

      // Append files to delete
      filesToDelete.forEach(filename => {
        formDataToSend.append('filesToDelete', filename);
      });

      // Append new files (multiple files allowed for GCO)
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const recordId = record.recordId || record.cor_record_id;
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/counseling-records/${recordId}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        // Prepare updated attachments for UI
        const updatedAttachments = [
          ...remainingExistingFiles,
          ...selectedFiles.map(file => ({
            filename: file.name,
            originalname: file.name,
            size: file.size,
            type: file.type
          }))
        ];

        const updatedRecord = {
          ...record,
          id: formData.studentId,
          name: formData.studentName,
          strand: formData.strand,
          gradeLevel: formData.gradeLevel,
          section: formData.section,
          sessionNumber: formData.sessionNumber,
          status: formData.status,
          date: formData.date,
          time: formData.time,
          concern: formData.generalConcern,
          remarks: formData.additionalRemarks,
          psychologicalCondition: formData.psychologicalCondition,
          attachments: updatedAttachments
        };

        setLastUpdatedRecord(updatedRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to update record');
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

    // NEW VALIDATION: Check if both are set to "No"
    if (formData.isPsychological === 'No' && formData.isMedical === 'No') {
      alert('Record cannot be neither medical nor psychological');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append all form data - FIXED: Added missing status field
      formDataToSend.append('studentId', formData.studentId);
      formDataToSend.append('studentName', formData.studentName);
      formDataToSend.append('strand', formData.strand);
      formDataToSend.append('gradeLevel', formData.gradeLevel);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('status', formData.status); // ADDED THIS LINE
      formDataToSend.append('medicalDetails', formData.medicalDetails);
      formDataToSend.append('remarks', formData.additionalRemarks);
      formDataToSend.append('referredToGCO', formData.referredToGCO);
      formDataToSend.append('isPsychological', formData.isPsychological);
      formDataToSend.append('isMedical', formData.isMedical);

      // Append existing files that are not marked for deletion
      const remainingExistingFiles = existingFiles.filter(file => 
        !filesToDelete.includes(file.filename)
      );
      formDataToSend.append('existingAttachments', JSON.stringify(remainingExistingFiles));

      // Append files to delete
      filesToDelete.forEach(filename => {
        formDataToSend.append('filesToDelete', filename);
      });

      // Append new files (multiple files allowed for INF)
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      // Append file classifications for new files
      console.log('Sending file classifications in edit:', fileClassifications);
      if (fileClassifications && fileClassifications.length > 0) {
        fileClassifications.forEach(classification => {
          console.log('Appending classification in edit:', classification);
          formDataToSend.append('fileClassifications', JSON.stringify(classification));
        });
      }

      const recordId = record.mr_medical_id || record.recordId;
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/medical-records/${recordId}`, {
        method: 'PUT',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        // Prepare updated attachments for UI
        const updatedAttachments = [
          ...remainingExistingFiles,
          ...selectedFiles.map((file, index) => {
            const classification = fileClassifications[index] || {};
            return {
              filename: file.name,
              originalname: file.name,
              size: file.size,
              type: file.type,
              isMedical: classification.isMedical || false,
              isPsychological: classification.isPsychological || false
            };
          })
        ];

        const updatedRecord = {
          ...record,
          mr_student_id: formData.studentId,
          mr_student_name: formData.studentName,
          mr_student_strand: formData.strand,
          mr_grade_level: formData.gradeLevel,
          mr_section: formData.section,
          mr_subject: formData.subject,
          mr_status: formData.status,
          mr_medical_details: formData.medicalDetails,
          mr_additional_remarks: formData.additionalRemarks,
          mr_referred: formData.referredToGCO,
          mr_is_psychological: formData.isPsychological,
          mr_is_medical: formData.isMedical,
          attachments: updatedAttachments
        };

        setLastUpdatedRecord(updatedRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to update record');
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
      isEditMode: true
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