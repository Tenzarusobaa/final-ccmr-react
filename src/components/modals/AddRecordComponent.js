// src/components/modals/AddRecordComponent.js
import React, { useState } from 'react';
import './AddRecordComponent.css';
import useStudentAutocomplete from '../../hooks/useStudentAutocomplete';
import OPDForm from '../forms/OPDForm';
import GCOForm from '../forms/GCOForm';
import INFForm from '../forms/INFForm';
import SuccessOverlay from '../common/SuccessOverlay';

const AddRecordComponent = ({ isOpen, onClose, onRecordAdded, type }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    strand: '',
    gradeLevel: '',
    section: '',
    // OPD fields
    violationLevel: '',
    status: '',
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
    referredToGCO: 'No',
    status: '' // Added for INF
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileClassifications, setFileClassifications] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAddedRecord, setLastAddedRecord] = useState(null);

  const {
    studentSuggestions,
    showSuggestions,
    isLoading,
    fetchStudentSuggestions,
    clearSuggestions
  } = useStudentAutocomplete();

  if (!isOpen) return null;

  const getPrimaryColor = () => {
    switch (type) {
      case "OPD": return "#003A6C";
      case "GCO": return "#00451D";
      case "INF": return "#640C17";
      default: return "#0a1a3c";
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case "OPD":
        return "Add Case Record";
      case "GCO":
        return "Add Counseling Record";
      case "INF":
        return "Add Medical/Psychological Record";
      default:
        return "Add Record";
    }
  };

  const getSuccessTitle = () => {
    switch (type) {
      case "OPD":
        return "Case Record Created Successfully!";
      case "GCO":
        return "Counseling Record Created Successfully!";
      case "INF":
        return "Medical Record Created Successfully!";
      default:
        return "Record Created Successfully!";
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
    console.log('File classifications received:', classifications);
    setFileClassifications(classifications);
  };

  const handleSaveOPDRecord = async () => {
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

      // Append files
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch('https://ccmr-final-node-production.up.railway.app/api/case-records', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        const newRecord = {
          caseNo: result.caseId,
          id: formData.studentId,
          name: formData.studentName,
          strand: formData.strand,
          gradeLevel: formData.gradeLevel,
          section: formData.section,
          violationLevel: formData.violationLevel,
          status: formData.status,
          date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          referred: formData.referToGCO,
          referralConfirmation: formData.referToGCO === "Yes" ? "Pending" : null,
          description: formData.generalDescription,
          remarks: formData.additionalRemarks,
          attachments: selectedFiles.map(file => ({
            filename: file.name,
            originalname: file.name,
            size: file.size,
            type: file.type
          }))
        };

        setLastAddedRecord(newRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to add record');
      }
    } catch (error) {
      console.error('Error saving case record:', error);
      alert(`Error saving record: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGCORecord = async () => {
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

      // Append files
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch('https://ccmr-final-node-production.up.railway.app/api/counseling-records', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        const newRecord = {
          recordId: result.recordId,
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
          attachments: selectedFiles.map(file => ({
            filename: file.name,
            originalname: file.name,
            size: file.size,
            type: file.type
          }))
        };

        setLastAddedRecord(newRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to add record');
      }
    } catch (error) {
      console.error('Error saving counseling record:', error);
      alert(`Error saving record: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveINFRecord = async () => {
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

      // Append all form data
      formDataToSend.append('studentId', formData.studentId);
      formDataToSend.append('studentName', formData.studentName);
      formDataToSend.append('strand', formData.strand);
      formDataToSend.append('gradeLevel', formData.gradeLevel);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('medicalDetails', formData.medicalDetails);
      formDataToSend.append('remarks', formData.additionalRemarks);
      formDataToSend.append('referredToGCO', formData.referredToGCO);
      formDataToSend.append('isPsychological', formData.isPsychological);
      formDataToSend.append('isMedical', formData.isMedical);

      // Append files
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      // Append file classifications - FIXED: Use the actual fileClassifications state
      console.log('Sending file classifications:', fileClassifications);
      if (fileClassifications && fileClassifications.length > 0) {
        fileClassifications.forEach(classification => {
          console.log('Appending classification:', classification);
          formDataToSend.append('fileClassifications', JSON.stringify(classification));
        });
      } else {
        console.log('No file classifications to send');
      }

      const response = await fetch('https://ccmr-final-node-production.up.railway.app/api/medical-records', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        const newRecord = {
          recordId: result.recordId,
          id: formData.studentId,
          name: formData.studentName,
          strand: formData.strand,
          gradeLevel: formData.gradeLevel,
          section: formData.section,
          subject: formData.subject,
          status: formData.status,
          medicalDetails: formData.medicalDetails,
          remarks: formData.additionalRemarks,
          referred: formData.referredToGCO,
          isPsychological: formData.isPsychological,
          isMedical: formData.isMedical,
          date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          attachments: selectedFiles.map((file, index) => {
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
        };

        setLastAddedRecord(newRecord);
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to add record');
      }
    } catch (error) {
      console.error('Error saving medical record:', error);
      alert(`Error saving record: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRecord = () => {
    if (type === "OPD") {
      handleSaveOPDRecord();
    } else if (type === "GCO") {
      handleSaveGCORecord();
    } else if (type === "INF") {
      handleSaveINFRecord();
    }
  };

  const handleSuccessView = () => {
    if (lastAddedRecord) {
      onRecordAdded(lastAddedRecord);
    }
    resetForm();
    setShowSuccess(false);
    onClose();
  };

  const handleSuccessExit = () => {
    if (lastAddedRecord) {
      onRecordAdded(lastAddedRecord);
    }
    resetForm();
    setShowSuccess(false);
    onClose();
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      studentName: '',
      strand: '',
      gradeLevel: '',
      section: '',
      violationLevel: '',
      status: '',
      referToGCO: '',
      generalDescription: '',
      additionalRemarks: '',
      sessionNumber: '',
      date: '',
      time: '',
      generalConcern: '',
      psychologicalCondition: 'NO',
      subject: '',
      medicalDetails: '',
      isPsychological: '',
      isMedical: '',
      referredToGCO: 'No',
      status: ''
    });
    setSelectedFiles([]);
    setFileClassifications([]);
    clearSuggestions();
    setLastAddedRecord(null);
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
      onFileClassifications: handleFileClassifications
    };

    switch (type) {
      case "OPD":
        return <OPDForm {...commonProps} />;
      case "GCO":
        return <GCOForm {...commonProps} />;
      case "INF":
        return <INFForm {...commonProps} />;
      default:
        return <p>Form content for {type}</p>;
    }
  };

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
            {renderFormContent()}
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={handleSaveRecord}
              style={{ backgroundColor: getPrimaryColor(), borderColor: getPrimaryColor() }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
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

export default AddRecordComponent;