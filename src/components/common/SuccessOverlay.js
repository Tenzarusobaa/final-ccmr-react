import React from 'react';
import './SuccessOverlay.css';

const SuccessOverlay = ({ 
  isVisible, 
  title = "Operation Completed Successfully!", 
  children,
  onView, 
  onExit,
  viewButtonText = "View",
  exitButtonText = "OK"
}) => {
  if (!isVisible) return null;

  return (
    <div className="success-overlay">
      <div className="success-modal">
        <div className="success-icon">✓</div>
        <h3 className="success-title">{title}</h3>
        
        {/* Add children content */}
        {children && (
          <div className="success-content">
            {children}
          </div>
        )}
        
        <div className="success-buttons">
          <button 
            className="success-btn exit-btn"
            onClick={onExit}
          >
            {exitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessOverlay;