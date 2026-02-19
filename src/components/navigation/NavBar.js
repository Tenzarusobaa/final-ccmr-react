// src/components/navigation/NavBar.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCaretDown, faCaretRight, faFileMedical } from "@fortawesome/free-solid-svg-icons";
import NotificationsModal from "../modals/NotificationModal";
import "./NavBar.css";

const NavBar = ({ userDepartment, userType, userName, onLogout, onExitViewAs }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [expandedOffice, setExpandedOffice] = useState(null);
    const [viewAs, setViewAs] = useState(userType); // Track which office to view as

    const department = userDepartment || localStorage.getItem('userDepartment') || 'Unknown Department';
    const type = userType || localStorage.getItem('userType') || 'Unknown Type';
    const name = userName || localStorage.getItem("userName") || "User";

    // Define office configurations for Administrator
    const officeConfigurations = {
        "Office of the Prefect of Discipline": {
            items: ["Dashboard", "OPD Records", "GCO Records", "INF Records","Student Data"],
            colorClass: "department-opd",
            type: "OPD"
        },
        "Guidance Counseling Office": {
            items: ["Dashboard", "GCO Records", "OPD Records", "INF Records", "Student Data"],
            colorClass: "department-gco",
            type: "GCO"
        },
        "Infirmary": {
            items: ["Dashboard", "INF Records", "GCO Records", "Student Data"],
            colorClass: "department-inf",
            type: "INF"
        }
    };

    // Define navigation items and their routes based on user type
    const getNavRoutes = () => {
        const viewType = type === "Administrator" && viewAs !== "Administrator" ? viewAs : type;

        switch (viewType) {
            case "OPD":
                return {
                    "Dashboard": "/dashboard",
                    "OPD Records": "/opd-records",
                    "GCO Records": "/gco-records",
                    "INF Records": "/inf-records",
                    "Medical Certificates": "/medical-certificates",
                    "Student Data": "/student-data"
                };
            case "GCO":
                return {
                    "Dashboard": "/dashboard",
                    "GCO Records": "/gco-records",
                    "OPD Records": "/opd-records",
                    "INF Records": "/inf-records",
                    "Medical Certificates": "/medical-certificates",
                    "Student Data": "/student-data"
                };
            case "INF":
                return {
                    "Dashboard": "/dashboard",
                    "INF Records": "/inf-records",
                    "GCO Records": "/gco-records",
                    "Medical Certificates": "/medical-certificates",
                    "Student Data": "/student-data"
                };
            case "Administrator":
                // For Administrator, show link to Administrator Dashboard
                return {
                    "Administrator Dashboard": "/administrator",
                };
            default:
                return {
                    "Dashboard": "/dashboard",
                };
        }
    };

    const navRoutes = getNavRoutes();
    const navItems = Object.keys(navRoutes);

    const handleNavClick = (item) => {
        if (navRoutes[item]) {
            navigate(navRoutes[item]);
        }
    };

    const handleOfficeClick = (office) => {
        setExpandedOffice(expandedOffice === office ? null : office);
    };

    const handleOfficeItemClick = (office, item) => {
        // Set view as the selected office type
        if (type === "Administrator") {
            const officeType = officeConfigurations[office].type;

            // Update viewAs state
            setViewAs(officeType);

            // Store the viewType in localStorage so Dashboard can access it
            localStorage.setItem('viewType', officeType);

            // Navigate to the appropriate route based on the item
            // For Administrator, use Admin View routes with separate dashboards
            const routeMap = {
                "Dashboard": getAdminDashboardRoute(officeType),
                "OPD Records": officeType === "GCO" ? "/admin-opd-records-gco" : "/admin-opd-records",
                "GCO Records": getAdminGCORecordsRoute(officeType),
                "INF Records": getAdminINFRecordsRoute(officeType),
                "Medical Certificates": getAdminMedicalCertificatesRoute(officeType),
                "Student Data": "/admin-student-data"
            };

            // Helper function to get the correct admin INF records route
            function getAdminINFRecordsRoute(officeType) {
                switch (officeType) {
                    case "INF": return "/admin-inf-records";
                    case "OPD": return "/admin-inf-records-opd";
                    case "GCO": return "/admin-inf-records-gco";
                    default: return "/admin-inf-records";
                }
            }

            // Helper function to get the correct admin dashboard route
            function getAdminDashboardRoute(officeType) {
                switch (officeType) {
                    case "OPD": return "/admin-opd-dashboard";
                    case "GCO": return "/admin-gco-dashboard";
                    case "INF": return "/admin-inf-dashboard";
                    default: return "/admin-dashboard";
                }
            }

            function getAdminGCORecordsRoute(officeType) {
                switch (officeType) {
                    case "GCO": return "/admin-gco-records";
                    case "OPD": return "/admin-gco-records-opd";
                    case "INF": return "/admin-gco-records-inf";
                    default: return "/admin-gco-records";
                }
            }

            // Helper function for admin medical certificates route
            function getAdminMedicalCertificatesRoute(officeType) {
                // Medical certificates can be the same for all offices since it's a consolidated view
                return "/admin-medical-certificates";
            }

            if (routeMap[item]) {
                // Force navigation with state to ensure re-render
                navigate(routeMap[item], {
                    state: {
                        viewType: officeType,
                        forceRefresh: true
                    }
                });
            }

            // Collapse the dropdown after selection
            setExpandedOffice(null);
        }
    };

    const handleNotificationsClick = () => {
        setIsNotificationsOpen(true);
    };

    const handleExitViewAs = () => {
        setViewAs("Administrator");
        localStorage.removeItem('viewType');
        // Force navigate to Administrator Dashboard to refresh state
        navigate("/administrator", { state: { forceRefresh: true } });
        // Call the parent's exit function if provided
        if (onExitViewAs) {
            onExitViewAs();
        }
    };

    // Check if current route matches nav item
    const isActive = (item) => {
        return location.pathname === navRoutes[item];
    };

    // Determine which view mode we're in
    const isViewingAsOffice = type === "Administrator" && viewAs !== "Administrator";

    return (
        <>
            <header className={`navbar-container ${type === "Administrator" ? "department-default" : `department-${type.toLowerCase()}`}`}>
                <div className="navbar-top">
                    {/* Logo */}
                    <div className="navbar-logo">
                        <img
                            src={require("../../assets/school-seal.png")}
                            alt="Logo"
                            className="navbar-logo-image"
                        />
                        <div className="navbar-logo-text-container">
                            <div className="navbar-logo-main-text">CCMR</div>
                            <div className="navbar-logo-department-text">
                                {isViewingAsOffice
                                    ? `${officeConfigurations[Object.keys(officeConfigurations).find(key => officeConfigurations[key].type === viewAs)]?.items ? Object.keys(officeConfigurations).find(key => officeConfigurations[key].type === viewAs) : department} (Viewing as ${viewAs})`
                                    : `${department} (${type})`
                                }
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="navbar-center">
                        {type === "Administrator" ? (
                            // Administrator view with dropdown offices
                            <>
                                {isViewingAsOffice ? (
                                    // When viewing as an office, show that office's navigation
                                    <>
                                        <div
                                            className="navbar-item view-as-indicator"
                                            style={{
                                                backgroundColor: '#ff9800',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                            onClick={handleExitViewAs}
                                        >
                                            Exit View as {viewAs}
                                        </div>
                                        {navItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`navbar-item ${isActive(item) ? 'active' : ''}`}
                                                onClick={() => handleNavClick(item)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {item === "Medical Certificates" && (
                                                    <FontAwesomeIcon icon={faFileMedical} style={{ marginRight: '5px' }} />
                                                )}
                                                {item}
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    // Normal administrator view with dropdowns
                                    <>
                                        <div
                                            className={`navbar-item ${isActive("Administrator Dashboard") ? 'active' : ''}`}
                                            onClick={() => handleNavClick("Administrator Dashboard")}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            Administrator Dashboard
                                        </div>

                                        {/* Office Dropdowns */}
                                        {Object.keys(officeConfigurations).map((office, index) => (
                                            <div
                                                key={index}
                                                className="nav-office-dropdown"
                                                style={{ position: 'relative' }}
                                            >
                                                <div
                                                    className="navbar-item"
                                                    onClick={() => handleOfficeClick(office)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px'
                                                    }}
                                                >
                                                    {office}
                                                    <FontAwesomeIcon
                                                        icon={expandedOffice === office ? faCaretDown : faCaretRight}
                                                        size="sm"
                                                    />
                                                </div>

                                                {/* Dropdown Menu */}
                                                {expandedOffice === office && (
                                                    <div
                                                        className="office-dropdown-menu"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: 0,
                                                            backgroundColor: 'white',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                            padding: '10px 0',
                                                            minWidth: '200px',
                                                            zIndex: 1000,
                                                            marginTop: '5px'
                                                        }}
                                                    >
                                                        {officeConfigurations[office].items.map((item, itemIndex) => (
                                                            <div
                                                                key={itemIndex}
                                                                onClick={() => handleOfficeItemClick(office, item)}
                                                                style={{
                                                                    padding: '8px 20px',
                                                                    cursor: 'pointer',
                                                                    color: '#333',
                                                                    transition: 'all 0.2s ease',
                                                                    fontSize: '14px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.backgroundColor = '#f0f0f0';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.backgroundColor = 'transparent';
                                                                }}
                                                            >
                                                                {item === "Medical Certificates" && (
                                                                    <FontAwesomeIcon icon={faFileMedical} style={{ color: '#28a745' }} />
                                                                )}
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        ) : (
                            // Regular user view
                            navItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`navbar-item ${isActive(item) ? 'active' : ''}`}
                                    onClick={() => handleNavClick(item)}
                                    style={{ cursor: 'pointer' }}
                                >
                                 
                                    {item}
                                </div>
                            ))
                        )}
                    </nav>

                    {/* Right Section */}
                    <div className="navbar-right">
                        <FontAwesomeIcon
                            icon={faBell}
                            className="navbar-notification-icon"
                            onClick={handleNotificationsClick}
                            style={{ cursor: 'pointer' }}
                            title="View notifications"
                        />
                        <div className="navbar-profile-circle">{name[0]}</div>
                        <button onClick={onLogout} className="navbar-logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Notifications Modal */}
            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                userType={type}
            />
        </>
    );
};

export default NavBar;