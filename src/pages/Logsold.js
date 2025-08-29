// src/pages/Logs.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../components/Auth';
import './Logs.css';
import { getCurrentUser, hasPrivilege } from '../components/Auth';

const Logs = () => {
  const [logEntries, setLogEntries] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('userLogs');
  const [canView, setCanView] = useState(false);
   const [userLogsPage, setUserLogsPage] = useState(1);
  const [systemLogsPage, setSystemLogsPage] = useState(1);
  const [userLogsTotalPages, setUserLogsTotalPages] = useState(1);
  const [systemLogsTotalPages, setSystemLogsTotalPages] = useState(1);
  const [itemsPerPage] = useState(50);

 
 
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch user logs
      const logsResponse = await authFetch('http://217.71.129.139:4821/api/logs');
      if (!logsResponse.ok) throw new Error('Failed to fetch user logs');
      const logsData = await logsResponse.json();
      setLogEntries(logsData);
      
      // Fetch system logs
      const systemResponse = await authFetch('http://217.71.129.139:4821/api/system-logs');
      if (!systemResponse.ok) throw new Error('Failed to fetch system logs');
      const systemData = await systemResponse.json();
      setSystemLogs(systemData);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
 useEffect(() => {
	

    const fetchUser = async () => {
      const user = await getCurrentUser();
      const canView = await hasPrivilege(user?.privilege, 'viewLogs');
      setCanView(canView);
      if (canView) {
        fetchLogs();
      }
    };
    
    fetchUser();
  }, []);

  if (!canView) {
    return (
      <div className="logs-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to view logs.</p>
      </div>
    );
  }
  
	
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
const getActionName = (idAction) => {
  // You should query this from your database instead of hardcoding
  const actions = {
    1: 'Create',
    2: 'Update',
    3: 'Delete',
    4: 'System Event',
    5: 'Login',
    6: 'Failed Login',
    7: 'Privilege Change'
  };
  return actions[idAction] || `Action ${idAction}`;
};

const parseDetails = (details) => {
  try {
    return JSON.parse(details);
  } catch {
    return { raw: details };
  }
};

  if (loading) {
    return (
      <div className="logs-container">
        <h2>Logs</h2>
        <div className="loading">Loading logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="logs-container">
        <h2>Logs</h2>
        <div className="error-message">
          Error: {error}
          <button onClick={fetchLogs} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <h2>System Logs</h2>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'userLogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('userLogs')}
        >
          User Actions
        </button>
        <button 
          className={`tab-button ${activeTab === 'systemLogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('systemLogs')}
        >
          System Events
        </button>
      </div>
      
      {activeTab === 'userLogs' ? (
        <div className="log-table-container">
          <table className="log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Lock ID</th>
                <th>Action</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.username || 'System'}</td>
                  <td>{log.id_lock ? (
                    <Link to={`/detail/${log.id_lock}`}>{log.id_lock}</Link>
                  ) : 'N/A'}</td>
                  <td>{getActionName(log.id_action)}</td>
                  <td>{formatTimestamp(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="log-table-container">
          <table className="log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Action</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {systemLogs.map((log) => {
  const details = parseDetails(log.details || '{}');
  return (
    <tr key={log.id_system_log}>
      <td>{log.id_system_log}</td>
      <td>{getActionName(log.id_action)}</td>
      <td>
        {details.user_id && `User: ${details.user_id}`}
        {details.lock_id && `Lock: ${details.lock_id}`}
        {details.old_state !== undefined && (
          <span>State: {details.old_state ? 'Open→Closed' : 'Closed→Open'}</span>
        )}
      </td>
      <td>{log.affected_ip}</td>
      <td>{formatTimestamp(log.timestamp)}</td>
    </tr>
  );
})}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="footer">
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    </div>
  );
};

export default Logs;