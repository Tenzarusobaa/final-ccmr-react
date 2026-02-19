// OPDMedicalRecordsINF.js - Updated with admin styling support
import React, { useState, useEffect } from 'react';
import './DashboardTables.css';

const OPDMedicalRecordsINF = ({ userType = 'default', onRowClick, isAdmin = false }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOPDUploadedFiles();
    }, []);

    const fetchOPDUploadedFiles = async () => {
        try {
            const baseUrl = process.env.REACT_APP_NODE_SERVER_URL;
            const apiUrl = `${baseUrl}api/medical-records`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.success) {
                // Extract all files uploaded by OPD from all records
                const opdFiles = [];
                
                data.records.forEach(record => {
                    if (record.attachments && Array.isArray(record.attachments)) {
                        record.attachments.forEach(file => {
                            // Check if file was uploaded by OPD
                            if (file.uploadedBy === 'OPD') {
                                opdFiles.push({
                                    recordId: record.recordId,
                                    name: record.name,
                                    fileName: file.originalname,
                                    uploadedDate: file.uploadDate || record.date,
                                    fileData: file,
                                    studentId: record.id,
                                    fullRecord: record
                                });
                            }
                        });
                    }
                });

                // Sort by upload date (most recent first) and limit to 10
                const recentOPDFiles = opdFiles
                    .sort((a, b) => new Date(b.uploadedDate) - new Date(a.uploadedDate))
                    .slice(0, 10);
                
                setRecords(recentOPDFiles);
            } else {
                setError('Failed to fetch records');
            }
        } catch (err) {
            setError('Error fetching OPD uploaded files');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (fileRecord) => {
        if (onRowClick) {
            // Pass the full medical record and file info
            onRowClick({
                ...fileRecord.fullRecord,
                selectedFile: fileRecord.fileData
            }, 'INF');
        }
    };

    // Get the appropriate class based on admin mode
    const getContainerClass = () => {
        if (isAdmin) return 'dashboard-table-container admin';
        return `dashboard-table-container ${userType.toLowerCase()}`;
    };

    // Get header class for admin mode
    const getHeaderClass = () => {
        return isAdmin ? 'admin-header' : '';
    };

    if (loading) return <div className="table-loading">Loading OPD uploaded files...</div>;
    if (error) return <div className="table-error">Error: {error}</div>;

    return (
        <div className={getContainerClass()}>
            <h3 className={getHeaderClass()}>Recent OPD Uploaded Files - Recent 10</h3>
            <div className="table-wrapper">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Record ID</th>
                            <th>Name</th>
                            <th>File Name</th>
                            <th>Upload Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map((fileRecord, index) => (
                                <tr 
                                    key={`${fileRecord.recordId}-${fileRecord.fileName}-${index}`}
                                    className="clickable-row"
                                    onClick={() => handleRowClick(fileRecord)}
                                >
                                    <td>{fileRecord.recordId}</td>
                                    <td>{fileRecord.name}</td>
                                    <td>{fileRecord.fileName}</td>
                                    <td>{new Date(fileRecord.uploadedDate).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="no-data">No files uploaded by OPD found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OPDMedicalRecordsINF;