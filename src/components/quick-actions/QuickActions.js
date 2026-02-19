import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuickActions.css';

// Get base URL from environment variables
const baseUrl = process.env.REACT_APP_NODE_SERVER_URL || "http://localhost:5000/";
const apiUrl = `${baseUrl}api`;

const QuickActions = ({ userType, isAdmin = false }) => {  // Add isAdmin prop with default false
  const [pendingReferrals, setPendingReferrals] = useState([]);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (userType === "GCO") {
      fetchPendingReferrals();
    }
  }, [userType]);

  // Fetch pending referrals for GCO users
  const fetchPendingReferrals = async () => {
    try {
      const response = await axios.get(`${apiUrl}/pending-referrals`);
      if (response.data.success) {
        setPendingReferrals(response.data.referrals);
      }
    } catch (error) {
      console.error("Error fetching pending referrals:", error);
    }
  };

  const handleConfirmReferral = async (recordId, recordType) => {
    try {
      const endpoint = recordType === 'case_record'
        ? `${apiUrl}/pending-referrals/case-record/${recordId}/confirm`
        : `${apiUrl}/pending-referrals/medical-record/${recordId}/confirm`;

      const response = await axios.put(endpoint);
      
      if (response.data.success) {
        setPendingReferrals(prev => prev.filter(ref => ref.record_id !== recordId));
        setSuccessMessage("Referral confirmed and counseling record created successfully!");
        setShowSuccessNotification(true);
        
        // Auto-hide success notification after 5 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 5000);
      } else {
        alert("Failed to confirm referral.");
      }
    } catch (error) {
      console.error("Error confirming referral:", error);
      alert("Error confirming referral.");
    }
  };

  const handleCloseNotification = () => {
    setShowSuccessNotification(false);
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Don't render QuickActions for OPD and INF users
  if (userType === "OPD" || userType === "INF") {
    return null;
  }

  // Only render for GCO users
  return (
    <div className="quick-actions-container">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="success-notification">
          <div className="success-message">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
          <button className="close-notification" onClick={handleCloseNotification}>
            ×
          </button>
        </div>
      )}

      
      {/* Pending Referrals Section */}
      <div className="pending-referrals-section">
        <h4>Pending Referrals</h4>
        {pendingReferrals.length === 0 ? (
          <p className="no-referrals">No pending referrals</p>
        ) : (
          <div className="referrals-list">
            {pendingReferrals.map((referral) => (
              <div key={`${referral.record_type}-${referral.record_id}`} className="referral-item">
                <div className="referral-info">
                  <div className="referral-id">ID: {referral.record_id}</div>
                  <div className="referral-sender">From: {referral.sender || "N/A"}</div>
                  <div className="referral-name">
                    Student: {truncateText(referral.mr_student_name || referral.cr_student_name, 15)}
                  </div>
                  <div className="referral-type">
                    Type: {referral.record_type === 'case_record' ? 'Case Record' : 'Medical Record'}
                  </div>
                </div>
                {/* Conditionally render confirm button - hide for admin view */}
                {!isAdmin && (
                  <button
                    className="confirm-button"
                    onClick={() => handleConfirmReferral(referral.record_id, referral.record_type)}
                  >
                    Confirm
                  </button>
                )}
                {/* Optionally show a "View Only" indicator for admin */}
                {isAdmin && (
                  <span className="admin-view-only-badge">View Only</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Updated Case Remarks Section */}
    </div>
  );
};

export default QuickActions;