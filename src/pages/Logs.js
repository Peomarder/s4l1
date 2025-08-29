// src/pages/Logs.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
	const [actionFilters, setActionFilters] = useState({
    // User log actions
    1: true,  // Create
    2: true,  // Update
    3: true,  // Delete
    
    // System log actions
    4: true,  // System Event
    5: true,  // Login
    6: true,  // Login Failed
    7: true,  // Privilege Change
    8: true,  // User Deletion
    9: true,  // User Creation
    10: true, // Lock Creation
    11: true, // Lock Status Change
    12: true, // Page View
    13: true, // API Call
    14: true  // Unauthorized Access
  });
 
  const [tempFilters, setTempFilters] = useState({ ...actionFilters });
  const [showFilters, setShowFilters] = useState(false);

	// Toggle filter visibility
const toggleFilters = () => {
  setShowFilters(!showFilters);
};

	// Action names mapping
  const actionNames = useMemo(() => ({
    1: 'Create',
    2: 'Update',
    3: 'Delete',
    4: 'System Event',
    5: 'Login',
    6: 'Login Failed',
    7: 'Privilege Change',
    8: 'User Deletion',
    9: 'User Creation',
    10: 'Lock Creation',
    11: 'Lock Status Change',
    12: 'Page View',
    13: 'API Call',
    14: 'Unauthorized Access'
  }), []);
  
  
// Handle checkbox changes
const handleFilterChange = (actionId) => {
  setTempFilters(prev => ({
    ...prev,
    [actionId]: !prev[actionId]
  }));
};

// Add a ref for tempFilters
const tempFiltersRef = useRef(tempFilters);
useEffect(() => {
  tempFiltersRef.current = tempFilters;
}, [tempFilters]);

// Update applyFilters to use the ref
const applyFilters = () => {
  const currentTempFilters = { ...tempFiltersRef.current };
  setActionFilters(currentTempFilters);
  actionFiltersRef.current = currentTempFilters; // Update the ref used by fetch functions
  setUserLogsPage(1);
  setSystemLogsPage(1);
  fetchUserLogs(1);
  fetchSystemLogs(1);
};

// Also update resetFilters to update the ref
const resetFilters = () => {
  const reset = {};
  Object.keys(tempFiltersRef.current).forEach(key => {
    reset[key] = true;
  });
  setTempFilters(reset);
  setActionFilters(reset);
  actionFiltersRef.current = reset; // Update the ref
  setUserLogsPage(1);
  setSystemLogsPage(1);
  fetchUserLogs(1);
  fetchSystemLogs(1);
};

// Group actions by category for display
const groupedActions = useMemo(() => {
  return {
    'User Actions': [1, 2, 3],
    'System Actions': [4, 5, 6, 7, 8, 9, 10, 11],
    'Activity Tracking': [12, 13, 14]
  };
}, []);

// Create a ref for actionFilters to use in fetch functions
const actionFiltersRef = useRef(actionFilters);
useEffect(() => {
  actionFiltersRef.current = actionFilters;
}, [actionFilters]);

 
 
// Update fetchUserLogs to include filters
const fetchUserLogs = useCallback(async (page) => {
  try {
    // Get selected actions for user logs
    const userActions = Object.keys(actionFiltersRef.current)
      .filter(key => key <= 3 && actionFiltersRef.current[key])
      .map(Number);
    
    const url = `http://217.71.129.139:4821/api/logs?page=${page}&limit=${itemsPerPage}` +
      (userActions.length ? `&actions=${userActions.join(',')}` : '');
    
    const response = await authFetch(url);
    if (!response.ok) throw new Error('Failed to fetch user logs');
    const data = await response.json();
    setLogEntries(data.logs);
    setUserLogsTotalPages(data.totalPages);
  } catch (error) {
    console.error('Error fetching user logs:', error);
    setError(error.message);
  }
}, [itemsPerPage]);

// Update fetchSystemLogs to include filters
const fetchSystemLogs = useCallback(async (page) => {
  try {
    // Get selected actions for system logs
    const systemActions = Object.keys(actionFiltersRef.current)
      .filter(key => key >= 4 && actionFiltersRef.current[key])
      .map(Number);
    
    const url = `http://217.71.129.139:4821/api/system-logs?page=${page}&limit=${itemsPerPage}` +
      (systemActions.length ? `&actions=${systemActions.join(',')}` : '');
    
    const response = await authFetch(url);
    if (!response.ok) throw new Error('Failed to fetch system logs');
    const data = await response.json();
    setSystemLogs(data.logs);
    setSystemLogsTotalPages(data.totalPages);
  } catch (error) {
    console.error('Error fetching system logs:', error);
    setError(error.message);
  }
}, [itemsPerPage]);
 
useEffect(() => {
  const fetchUser = async () => {
    const user = await getCurrentUser();
    const canView = await hasPrivilege(user?.privilege, 'viewLogs');
    setCanView(canView);
    if (canView) {
      try {
        await Promise.all([
          fetchUserLogs(userLogsPage),
          fetchSystemLogs(systemLogsPage)
        ]);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  fetchUser();
}, [fetchUserLogs, fetchSystemLogs, userLogsPage, systemLogsPage]);
  
  
  if (!canView) {
    return (
      <div className="logs-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to view logs.</p>
      </div>
    );
  }
  
  const handlePageChange = (newPage, isUserLogs) => {
    if (isUserLogs) {
      setUserLogsPage(newPage);
      fetchUserLogs(newPage);
    } else {
      setSystemLogsPage(newPage);
      fetchSystemLogs(newPage);
    }
  };
	
  // Render pagination controls
  const renderPagination = (currentPage, totalPages, isUserLogs) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="pagination-controls">
        <button 
          onClick={() => handlePageChange(1, isUserLogs)} 
          disabled={currentPage === 1}
        >
          &laquo; First
        </button>
        <button 
          onClick={() => handlePageChange(Math.max(1, currentPage - 1), isUserLogs)}
          disabled={currentPage === 1}
        >
          &lsaquo; Prev
        </button>
        
        <span className="page-info">
          Page 
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages);
              handlePageChange(page, isUserLogs);
            }}
          />
          of {totalPages}
        </span>
        
        <button 
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1), isUserLogs)}
          disabled={currentPage === totalPages}
        >
          Next &rsaquo;
        </button>
        <button 
          onClick={() => handlePageChange(totalPages, isUserLogs)} 
          disabled={currentPage === totalPages}
        >
          Last &raquo;
        </button>
      </div>
    );
  };

	
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // I should query this from your database instead of hardcoding
const getActionName = (idAction) => {
  return actionNames[idAction] || `Action ${idAction}`;
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
          <button onClick={() => window.location.reload()} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <h2>System Logs</h2>
      <button className="filter-toggle" onClick={toggleFilters}>
    {showFilters ? 'Hide Filters' : 'Show Filters'}
  </button>
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
      
{showFilters && (
  <div className="filter-panel">
    <div className="filter-groups">
      {Object.entries(groupedActions).map(([group, actions]) => (
        <div key={group} className="filter-group">
          <h3>{group}</h3>
          <div className="filter-checkboxes">
            {actions.map(actionId => (
              <label key={actionId} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={tempFilters[actionId]}
                  onChange={() => handleFilterChange(actionId)}
                />
                <span className="checkmark"></span>
                {actionNames[actionId]}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
    
    <div className="filter-buttons">
      <button className="apply-button" onClick={applyFilters}>
        Apply Filters
      </button>
      <button className="reset-button" onClick={resetFilters}>
        Reset Filters
      </button>
    </div>
  </div>
)}

	  
<div className="filter-indicator">
  Showing: {activeTab === 'userLogs' 
    ? Object.keys(actionFilters)
        .filter(key => key <= 3 && actionFilters[key])
        .map(id => actionNames[id]).join(', ')
    : Object.keys(actionFilters)
        .filter(key => key >= 4 && actionFilters[key])
        .map(id => actionNames[id]).join(', ')}
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
                  <td>{log.id_log}</td>
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
		  {renderPagination(userLogsPage, userLogsTotalPages, true)}
       
        </div>
      ) : (
        <div className="log-table-container">
    <table className="log-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Action</th>
      <th>User</th>
      <th>IP Address</th>
      <th>Endpoint</th>
      <th>Details</th>
      <th>Timestamp</th>
    </tr>
  </thead>
  <tbody>
    {systemLogs.map((log) => (
      <tr key={log.id_system_log}>
        <td>{log.id_system_log}</td>
        <td>{getActionName(log.id_action)}</td>
        <td>{log.username || 'System'}</td>
        <td>{log.affected_ip || 'N/A'}</td>
        <td>{log.endpoint || 'N/A'}</td>
        <td>{log.details ? JSON.stringify(parseDetails(log.details)) : 'N/A'}</td>
        <td>{formatTimestamp(log.timestamp)}</td>
      </tr>
    ))}
  </tbody>
</table>
    {renderPagination(systemLogsPage, systemLogsTotalPages, false)}
  </div>
      )}
      
      <div className="footer">
        <Link to="/" className="back-link">Back to Home</Link>
      </div>
    </div>
  );
};

export default Logs;