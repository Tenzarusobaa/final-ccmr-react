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

  // State for GCO analytics
  const [gcoData, setGcoData] = useState({
    scheduled: 0,
    to_schedule: 0,
    done: 0
  });

  // State for INF analytics
  const [infData, setInfData] = useState({
    medical: 0,
    psychological: 0,
    ongoing: 0,
    treated: 0,
    for_treatment: 0
  });

  // State for monthly case data
  const [monthlyOpdData, setMonthlyOpdData] = useState([]);
  const [monthlyGcoData, setMonthlyGcoData] = useState([]);
  const [infCertificateData, setInfCertificateData] = useState([]);

  useEffect(() => {
    // Fetch OPD/INF analytics
    axios.get(`${apiUrl}/analytics`)
      .then(res => {
        console.log("OPD analytics response:", res.data);

        // Handle array, nulls, or string-number issues
        const data = Array.isArray(res.data) ? res.data[0] : res.data || {};

        setOpdData({
          minor: Number(data.minor || data.Minor || 0),
          major: Number(data.major || data.Major || 0),
          serious: Number(data.serious || data.Serious || 0),
          ongoing: Number(data.ongoing || data.Ongoing || 0),
          resolved: Number(data.resolved || data.Resolved || 0),
        });
      })
      .catch(err => console.error("Error fetching OPD analytics:", err));

    // Fetch GCO analytics
    axios.get(`${apiUrl}/gco-analytics`)
      .then(res => {
        console.log("GCO analytics response:", res.data);

        const data = Array.isArray(res.data) ? res.data[0] : res.data || {};

        setGcoData({
          scheduled: Number(data.scheduled || data.Scheduled || 0),
          to_schedule: Number(data.to_schedule || data["to_schedule"] || 0),
          done: Number(data.done || data.Done || 0),
        });
      })
      .catch(err => console.error("Error fetching GCO analytics:", err));

    // Fetch INF analytics for INF users
    if (userType === "INF") {
      axios.get(`${apiUrl}/inf-analytics`)
        .then(res => {
          console.log("INF analytics response:", res.data);

          // Remove the array check - use res.data directly
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

      // Fetch INF certificate data
      axios.get(`${apiUrl}/inf-certificate-data`)
        .then(res => {
          console.log("INF certificate data response:", res.data);
          setInfCertificateData(res.data || []);
        })
        .catch(err => console.error("Error fetching INF certificate data:", err));
    }

    // Fetch monthly OPD data for OPD users
    if (userType === "OPD") {
      axios.get(`${apiUrl}/monthly-opd-cases`)
        .then(res => {
          console.log("Monthly OPD data response:", res.data);
          setMonthlyOpdData(res.data || []);
        })
        .catch(err => console.error("Error fetching monthly OPD data:", err));
    }

    // Fetch monthly GCO data for GCO users
    if (userType === "GCO") {
      axios.get(`${apiUrl}/monthly-gco-cases`)
        .then(res => {
          console.log("Monthly GCO data response:", res.data);
          setMonthlyGcoData(res.data || []);
        })
        .catch(err => console.error("Error fetching monthly GCO data:", err));
    }
  }, [userType]);

  // Calculate percentages for OPD violation data
  const calculateOpdViolationPercentages = () => {
    const total = (opdData.minor || 0) + (opdData.major || 0) + (opdData.serious || 0);
    if (!total || isNaN(total)) return { minor: 0, major: 0, serious: 0 };

    return {
      minor: Math.round((opdData.minor / total) * 100),
      major: Math.round((opdData.major / total) * 100),
      serious: Math.round((opdData.serious / total) * 100)
    };
  };

  // Calculate percentages for OPD status data
  const calculateOpdStatusPercentages = () => {
    const total = (opdData.ongoing || 0) + (opdData.resolved || 0);
    if (!total || isNaN(total)) return { ongoing: 0, resolved: 0 };

    return {
      ongoing: Math.round((opdData.ongoing / total) * 100),
      resolved: Math.round((opdData.resolved / total) * 100)
    };
  };

  // Calculate percentages for GCO data
  const calculateGcoPercentages = () => {
    const total = (gcoData.scheduled || 0) + (gcoData.to_schedule || 0) + (gcoData.done || 0);
    if (!total || isNaN(total)) return { scheduled: 0, to_schedule: 0, done: 0 };

    return {
      scheduled: Math.round((gcoData.scheduled / total) * 100),
      to_schedule: Math.round((gcoData.to_schedule / total) * 100),
      done: Math.round((gcoData.done / total) * 100)
    };
  };

  // Calculate percentages for INF medical data
  const calculateInfMedicalPercentages = () => {
    const total = (infData.medical || 0) + (infData.psychological || 0);
    if (!total || isNaN(total)) return { medical: 0, psychological: 0 };

    return {
      medical: Math.round((infData.medical / total) * 100),
      psychological: Math.round((infData.psychological / total) * 100)
    };
  };

  // Calculate percentages for INF status data
  const calculateInfStatusPercentages = () => {
    const total = (infData.ongoing || 0) + (infData.treated || 0) + (infData.for_treatment || 0);
    if (!total || isNaN(total)) return { ongoing: 0, treated: 0, for_treatment: 0 };

    return {
      ongoing: Math.round((infData.ongoing / total) * 100),
      treated: Math.round((infData.treated / total) * 100),
      for_treatment: Math.round((infData.for_treatment / total) * 100)
    };
  };

  // Prepare monthly OPD bar chart data
  const prepareMonthlyOpdBarData = () => {
    const labels = monthlyOpdData.map(item => item.month);
    const grade11Data = monthlyOpdData.map(item => item.grade_11 || 0);
    const grade12Data = monthlyOpdData.map(item => item.grade_12 || 0);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Grade 11',
          data: grade11Data,
          backgroundColor: '#FF6B35',
          borderColor: '#FF6B35',
          borderWidth: 1,
        },
        {
          label: 'Grade 12',
          data: grade12Data,
          backgroundColor: '#4ECDC4',
          borderColor: '#4ECDC4',
          borderWidth: 1,
        }
      ]
    };
  };

  // Prepare monthly GCO bar chart data
  const prepareMonthlyGcoBarData = () => {
    const labels = monthlyGcoData.map(item => item.month);
    const grade11Data = monthlyGcoData.map(item => item.grade_11 || 0);
    const grade12Data = monthlyGcoData.map(item => item.grade_12 || 0);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Grade 11',
          data: grade11Data,
          backgroundColor: '#00210E',
          borderColor: '#00210E',
          borderWidth: 1,
        },
        {
          label: 'Grade 12',
          data: grade12Data,
          backgroundColor: '#E03011',
          borderColor: '#E03011',
          borderWidth: 1,
        }
      ]
    };
  };

  // Prepare INF certificate bar chart data
  const prepareInfCertificateBarData = () => {
    const labels = ['With Certificates', 'Without Certificates'];
    const grade11Data = [
      infCertificateData.with_certificates_grade_11 || 0,
      infCertificateData.without_certificates_grade_11 || 0
    ];
    const grade12Data = [
      infCertificateData.with_certificates_grade_12 || 0,
      infCertificateData.without_certificates_grade_12 || 0
    ];

    return {
      labels: labels,
      datasets: [
        {
          label: 'Grade 11',
          data: grade11Data,
          backgroundColor: '#640C17',
          borderColor: '#640C17',
          borderWidth: 1,
        },
        {
          label: 'Grade 12',
          data: grade12Data,
          backgroundColor: '#841c27',
          borderColor: '#841c27',
          borderWidth: 1,
        }
      ]
    };
  };

  const opdViolationPercentages = calculateOpdViolationPercentages();
  const opdStatusPercentages = calculateOpdStatusPercentages();
  const gcoPercentages = calculateGcoPercentages();
  const infMedicalPercentages = calculateInfMedicalPercentages();
  const infStatusPercentages = calculateInfStatusPercentages();

  // OPD Violation Chart Data
  const opdViolationChartData = {
    labels: [
      `Minor: ${opdViolationPercentages.minor}%`,
      `Major: ${opdViolationPercentages.major}%`,
      `Serious: ${opdViolationPercentages.serious}%`
    ],
    datasets: [
      {
        data: [opdData.minor, opdData.major, opdData.serious],
        backgroundColor: ["#FFD700", "#0033CC", "#CC3333"],
      }
    ]
  };

  // GCO Chart Data
  const gcoChartData = {
    labels: [
      `Scheduled: ${gcoPercentages.scheduled}%`,
      `To Schedule: ${gcoPercentages.to_schedule}%`,
      `Done: ${gcoPercentages.done}%`
    ],
    datasets: [
      {
        data: [gcoData.scheduled, gcoData.to_schedule, gcoData.done],
        backgroundColor: ["#00210E", "#E03011", "#D8D117"],
      }
    ]
  };

  // INF Medical Chart Data
  const infMedicalChartData = {
    labels: [
      `Medical: ${infMedicalPercentages.medical}%`,
      `Psychological: ${infMedicalPercentages.psychological}%`
    ],
    datasets: [
      {
        data: [infData.medical, infData.psychological],
        backgroundColor: ["#640C17", "#841c27"],
      }
    ]
  };

  // INF Status Chart Data
  const infStatusChartData = {
    labels: [
      `Ongoing: ${infStatusPercentages.ongoing}%`,
      `Treated: ${infStatusPercentages.treated}%`,
      `For Treatment: ${infStatusPercentages.for_treatment}%`
    ],
    datasets: [
      {
        data: [infData.ongoing, infData.treated, infData.for_treatment],
        backgroundColor: ["#FF6B35", "#4ECDC4", "#45B7D1"],
      }
    ]
  };

  // Monthly OPD Bar Chart Data
  const monthlyOpdBarData = prepareMonthlyOpdBarData();

  // Monthly GCO Bar Chart Data
  const monthlyGcoBarData = prepareMonthlyGcoBarData();

  // INF Certificate Bar Chart Data
  const infCertificateBarData = prepareInfCertificateBarData();

  // Chart options for Pie Charts
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label.replace(/: \d+%/, '')}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff'
      }
    }
  };

  // Chart options for Bar Charts
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cases by Grade Level'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Cases'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Certificate Status'
        }
      }
    }
  };

  // Plugin to draw % labels inside pie chart
  const pieChartPlugins = [{
    id: 'pieChartLabels',
    afterDraw: (chart) => {
      const { ctx } = chart;
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

      chart.data.datasets.forEach((dataset, i) => {
        chart.getDatasetMeta(i).data.forEach((arc, index) => {
          const value = dataset.data[index];
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
          if (percentage >= 5) {
            const angle = arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
            const x = arc.x + Math.cos(angle) * (arc.outerRadius * 0.7);
            const y = arc.y + Math.sin(angle) * (arc.outerRadius * 0.7);
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage}%`, x, y);
            ctx.restore();
          }
        });
      });
    }
  }];

  return (
    <div className="analytics-report-container">
      {/* Show OPD Analytics for OPD users */}
      {userType === "OPD" && (
        <div className="analytics-section">
          <h4>Case Records - Violation Levels</h4>
          <div className="analytics-flex">
            <div className="analytics-chart-container">
              <div className="analytics-chart">
                <Pie
                  data={opdViolationChartData}
                  options={pieChartOptions}
                  plugins={pieChartPlugins}
                />
              </div>
            </div>
            <div className="analytics-legend">
              <p><span style={{ color: "#FFD700" }}>■</span> Minor Offenses: {opdData.minor} ({opdViolationPercentages.minor}%)</p>
              <p><span style={{ color: "#0033CC" }}>■</span> Major Offenses: {opdData.major} ({opdViolationPercentages.major}%)</p>
              <p><span style={{ color: "#CC3333" }}>■</span> Serious Offenses: {opdData.serious} ({opdViolationPercentages.serious}%)</p>
            </div>
          </div>

          <h4>Monthly Cases by Grade Level</h4>
          <div className="analytics-bar-chart-container">
            <div className="analytics-bar-chart">
              <Bar
                data={monthlyOpdBarData}
                options={barChartOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Show GCO Analytics for GCO users */}
      {userType === "GCO" && (
        <div className="analytics-section">
          <h4>Counseling Analytics - Status</h4>
          <div className="gco-analytics-flex">
            <div className="gco-analytics-chart-container">
              <div className="gco-analytics-chart">
                <Pie
                  data={gcoChartData}
                  options={pieChartOptions}
                  plugins={pieChartPlugins}
                />
              </div>
            </div>
            <div className="gco-analytics-legend">
              <p><span style={{ color: "#00210E" }}>■</span> Scheduled: {gcoData.scheduled} ({gcoPercentages.scheduled}%)</p>
              <p><span style={{ color: "#E03011" }}>■</span> To Schedule: {gcoData.to_schedule} ({gcoPercentages.to_schedule}%)</p>
              <p><span style={{ color: "#D8D117" }}>■</span> Done: {gcoData.done} ({gcoPercentages.done}%)</p>
            </div>
          </div>

          <h4>Monthly Counseling Cases by Grade Level</h4>
          <div className="analytics-bar-chart-container">
            <div className="analytics-bar-chart">
              <Bar
                data={monthlyGcoBarData}
                options={barChartOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Show INF Analytics for INF users */}
      {userType === "INF" && (
        <div className="analytics-section">
          <h4>Medical Records - Case Types</h4>
          <div className="inf-analytics-flex">
            <div className="inf-analytics-chart-container">
              <div className="inf-analytics-chart">
                <Pie
                  data={infMedicalChartData}
                  options={pieChartOptions}
                  plugins={pieChartPlugins}
                />
              </div>
            </div>
            <div className="inf-analytics-legend">
              <p><span style={{ color: "#640C17" }}>■</span> Medical Cases: {infData.medical} ({infMedicalPercentages.medical}%)</p>
              <p><span style={{ color: "#841c27" }}>■</span> Psychological Cases: {infData.psychological} ({infMedicalPercentages.psychological}%)</p>
            </div>
          </div>

          <h4>Medical Records - Certificate Status</h4>
          <div className="analytics-bar-chart-container">
            <div className="analytics-bar-chart">
              <Bar
                data={infCertificateBarData}
                options={barChartOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReport;