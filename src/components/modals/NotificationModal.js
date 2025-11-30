// src/components/modals/NotificationsModal.js
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCircle, faCircleCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import "./NotificationModal.css";

const NotificationModal = ({ isOpen, onClose, userType }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && userType) {
      fetchNotifications();
    }
  }, [isOpen, userType]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/notifications?receiver=${userType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        throw new Error(data.error || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.n_id === notificationId ? { ...notif, n_is_read: "Yes" } : notif
          )
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`https://ccmr-final-node-production.up.railway.app/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiver: userType }),
      });

      if (response.ok) {
        // Update all notifications to read
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, n_is_read: "Yes" }))
        );
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => notif.n_is_read === "No").length;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Notifications</h2>
          <div className="header-actions">
            {getUnreadCount() > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <FontAwesomeIcon icon={faCheckDouble} />
                Mark all as read
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="notification-modal-content">
          {loading && (
            <div className="loading-state">Loading notifications...</div>
          )}

          {error && (
            <div className="error-state">
              {error}
              <button onClick={fetchNotifications} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="empty-state">
              <FontAwesomeIcon icon={faCircleCheck} className="empty-icon" />
              <p>No notifications</p>
              <span>You're all caught up!</span>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.n_id}
                  className={`notification-item ${notification.n_is_read === "No" ? "unread" : "read"}`}
                  onClick={() => markAsRead(notification.n_id)}
                >
                  <div className="notification-indicator">
                    {notification.n_is_read === "No" && (
                      <FontAwesomeIcon icon={faCircle} className="unread-dot" />
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">
                      {notification.n_message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-type">{notification.n_type}</span>
                      <span className="notification-date">
                        {formatDate(notification.n_created_at)}
                      </span>
                    </div>
                    <div className="notification-sender">
                      From: {notification.n_sender}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="notifications-summary">
            {notifications.length > 0 && (
              <>
                <span className="total-count">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                </span>
                {getUnreadCount() > 0 && (
                  <span className="unread-count">
                    {getUnreadCount()} unread
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;