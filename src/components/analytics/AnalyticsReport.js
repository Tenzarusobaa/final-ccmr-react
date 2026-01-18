import React, { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from "chart.js";
import './AnalyticsReport.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Get base URL from environment variables
const baseUrl = process.env.REACT_APP_NODE_SERVER_URL || "https://ccmr-final-node-production.up.railway.app/";
const apiUrl = `${baseUrl}api`;

const AnalyticsReport = ({ userType }) => {
  // State for OPD/INF analytics
  const [opdData, setOpdData] = useState({
    minor: 0,
    major: 0,
    serious: 0,
    ongoing: 0,
    resolved: 0
  });

  const [gcoData, setGcoData] = useState({
    scheduled: 0,
    to_schedule: 0,
    done: 0
  });

  const [infData, setInfData] = useState({
    medical: 0,
    psychological: 0,
    ongoing: 0,
    treated: 0,
    for_treatment: 0
  });

  const [monthlyOpdData, setMonthlyOpdData] = useState([]);
  const [monthlyGcoData, setMonthlyGcoData] = useState([]);
  const [infCertificateData, setInfCertificateData] = useState([]);

  useEffect(() => {
    axios.get(`${apiUrl}/analytics`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data || {};
        setOpdData({
          minor: Number(data.minor || 0),
          major: Number(data.major || 0),
          serious: Number(data.serious || 0),
          ongoing: Number(data.ongoing || 0),
          resolved: Number(data.resolved || 0),
        });
      })
      .catch(err => console.error("Error fetching OPD analytics:", err));

    axios.get(`${apiUrl}/gco-analytics`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data || {};
        setGcoData({
          scheduled: Number(data.scheduled || 0),
          to_schedule: Number(data.to_schedule || 0),
          done: Number(data.done || 0),
        });
      })
      .catch(err => console.error("Error fetching GCO analytics:", err));

    if (userType === "INF") {
      axios.get(`${apiUrl}/inf-analytics`)
        .then(res => {
          const data = res.data || {};
          setInfData({
            medical: Number(data.medical || 0),
            psychological: Number(data.psychological || 0),
            ongoing: Number(data.ongoing || 0),
            treated: Number(data.treated || 0),
            for_treatment: Number(data.for_treatment || 0),
          });
        })
        .catch(err => console.error("Error fetching INF analytics:", err));

      axios.get(`${apiUrl}/inf-certificate-data`)
        .then(res => {
          setInfCertificateData(res.data || []);
        })
        .catch(err => console.error("Error fetching INF certificate data:", err));
    }

    if (userType === "OPD") {
      axios.get(`${apiUrl}/monthly-opd-cases`)
        .then(res => {
          setMonthlyOpdData(res.data || []);
        })
        .catch(err => console.error("Error fetching monthly OPD data:", err));
    }

    if (userType === "GCO") {
      axios.get(`${apiUrl}/monthly-gco-cases`)
        .then(res => {
          setMonthlyGcoData(res.data || []);
        })
        .catch(err => console.error("Error fetching monthly GCO data:", err));
    }
  }, [userType]);

  return (
    <div className="analytics-report-container">

      {/* OPD Section */}
      {userType === "OPD" && (
        <div className="analytics-section">
          <h4>Case Records - Violation Levels</h4>
          <h4>Monthly Cases by Grade Level</h4>
        </div>
      )}

      {/* GCO Section */}
      {userType === "GCO" && (
        <div className="analytics-section">
          <h4>Counseling Analytics - Status</h4>
          <h4>Monthly Counseling Cases by Grade Level</h4>
        </div>
      )}

      {/* INF Section */}
      {userType === "INF" && (
        <div className="analytics-section">
          <h4>Medical Records - Case Types</h4>
          <h4>Medical Records - Certificate Status</h4>
        </div>
      )}

    </div>
  );
};

export default AnalyticsReport;
