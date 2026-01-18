// src/pages/Login/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import DemoOverlay from './DemoOverlay';

// Import local assets
import backgroundImage from '../assets/xh.jpg';
import schoolLogo from '../assets/school-seal.png';
import googleLogo from '../assets/google-logo.png';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '299249406096-hav2dfea6lmr6uavth4ufuslll1o1sl4.apps.googleusercontent.com';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load Google script on component mount
  useEffect(() => {
    loadGoogleScript();
  }, []);

  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google script loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Google script');
        reject(new Error('Failed to load Google authentication'));
      };
      document.head.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://ccmr-final-node-production.up.railway.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message === 'User found') {
          handleLoginSuccess(data.user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Cannot connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      // Ensure Google script is loaded
      await loadGoogleScript();

      // Initialize Google Auth2
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        ux_mode: 'popup'
      });

      // Trigger Google login popup
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Try direct render if prompt is skipped
          window.google.accounts.id.renderButton(
            document.getElementById('googleButtonContainer'),
            { theme: 'outline', size: 'large' }
          );
        }
      });

    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to initialize Google login. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      const { credential } = response;
      console.log('Google response received');

      // Send token to backend for verification
      const apiResponse = await fetch('https://ccmr-final-node-production.up.railway.app/api/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      const data = await apiResponse.json();

      if (apiResponse.ok) {
        handleLoginSuccess(data.user);
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Google response error:', error);
      setError('Failed to authenticate with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    const user = {
      token: `user_${userData.email}_${Date.now()}`,
      type: userData.type,
      email: userData.email,
      name: userData.name,
      department: userData.department || getDepartmentFromType(userData.type),
      picture: userData.picture
    };
    
    // Store in localStorage
    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userType', user.type);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userDepartment', user.department);
    if (user.picture) {
      localStorage.setItem('userPicture', user.picture);
    }
    
    onLogin(user);
    navigate('/dashboard');
  };

  const getDepartmentFromType = (userType) => {
    const departmentMap = {
      'GCO': 'Guidance Counseling Office',
      'INF': 'Infirmary',
      'OPD': 'Office of the Prefect of Discipline'
    };
    return departmentMap[userType] || 'Unknown Department';
  };

  return (
    <div className="login-container">
      {/* <DemoOverlay /> */}
      <div className="left" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="overlay"></div>
        <div className="left-content">
          <img src={schoolLogo} alt="School Logo" />
          <h2>CCMR</h2>
          <p>Case, Counseling, Medical Records</p>
        </div>
      </div>

      <div className="right">
        <div className="login-box">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button 
            className="google-btn" 
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
          >
            <img src={googleLogo} alt="Google Logo" />
            {googleLoading ? 'Connecting...' : 'Sign in with Google'}
          </button>

          {/* Fallback Google Button Container */}
          <div id="googleButtonContainer" style={{ marginBottom: '15px' }}></div>

          <div className="divider">or</div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                id="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || googleLoading}
              />
              <label htmlFor="email">Email Address</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                id="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || googleLoading}
              />
              <label htmlFor="password">Password</label>
            </div>

            <div className="options">
              <label> Remember me </label>
              <a href="#forgot">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading || googleLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '14px' }}>
            Test verification values:  <a href="#signup" style={{ color: '#003A6C', textDecoration: 'none' }}></a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;