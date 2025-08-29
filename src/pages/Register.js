// src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, getCurrentUser, getPrivileges } from '../components/Auth';
//import './Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState(''); // Add email field
  const [name, setName] = useState('');   // Add name field
  const [testResult, setTestResult] = useState(''); // New state for test result
  const [privileges, setPrivileges] = useState([]);
  const [selectedPrivilege, setSelectedPrivilege] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

	
  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser();
      setIsAdmin(user?.privilege === 'Admin');
      if (!user || user.privilege !== 'Admin') {
        navigate('/');
      }
    };
    
    const fetchPrivileges = async () => {
      setPrivileges(await getPrivileges());
    };
    
    checkAdmin();
    fetchPrivileges();
  }, [navigate]);

  if (!isAdmin) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Access Denied</h2>
          <p>Only administrators can register new users.</p>
        </div>
      </div>
    );
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(username, password, email, name,selectedPrivilege);
      alert('User registered successfully!');
    } catch (err) {
    const errorResponse = await err.response?.json();
    setError(errorResponse?.error || 'Registration failed');
    }
  };
  
    // New function to call the test endpoint
  const handleTest = async () => {
    try {
      const response = await fetch('http://217.71.129.139:4821/api/test');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      setTestResult(text);
    } catch (err) {
      setTestResult('Error: ' + err.message);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register User</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
		<div className="form-group">
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Full Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
		
		
        <div className="form-group">
          <label>Privilege:</label>
          <select
            value={selectedPrivilege}
            onChange={(e) => setSelectedPrivilege(e.target.value)}
            required
          >
            <option value="">Select Privilege</option>
            {privileges.map(priv => (
              <option key={priv.id_privilege} value={priv.id_privilege}>
                {priv.name}
              </option>
            ))}
          </select>
        </div>
		
        <button type="submit" className="submit-btn">Register</button>
		
        {/* Test API button 
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={handleTest}
            className="submit-btn"
            style={{ backgroundColor: '#6c757d' }}
          >
            Test API Connection
          </button>
          {testResult && (
            <div className="test-result" style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <strong>API Response:</strong> {testResult}
            </div>
          )}
        </div>
		*/}
		
		
        <div className="auth-footer">
          Want to access the login page? <a href="/login">Login</a>
        </div>
      </form>
    </div>
  );
};

export default Register;