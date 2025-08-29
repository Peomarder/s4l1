// src/pages/Logs.js
import React, { useEffect, useState, useMemo } from 'react';
// ... other imports ...

const Logs = () => {
  // ... existing state variables ...
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

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      
      // Get selected actions for user logs
      const userActions = Object.keys(actionFilters)
        .filter(key => key <= 3 && actionFilters[key])
        .map(Number);
        
      // Get selected actions for system logs
      const systemActions = Object.keys(actionFilters)
        .filter(key => key >= 4 && actionFilters[key])
        .map(Number);
      
      // Fetch user logs with pagination and filtering
      const logsUrl = `http://217.71.129.139:4821/api/logs?page=${page}&limit=${itemsPerPage}` +
        (userActions.length ? `&actions=${userActions.join(',')}` : '');
      
      const logsResponse = await authFetch(logsUrl);
      // ... rest of user logs fetch ...
      
      // Fetch system logs with pagination and filtering
      const systemUrl = `http://217.71.129.139:4821/api/system-logs?page=${page}&limit=${itemsPerPage}` +
        (systemActions.length ? `&actions=${systemActions.join(',')}` : '');
      
      const systemResponse = await authFetch(systemUrl);
      // ... rest of system logs fetch ...
      
    } catch (error) {
      // ... error handling ...
    }
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle checkbox changes
  const handleFilterChange = (actionId) => {
    setTempFilters(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setActionFilters({ ...tempFilters });
    fetchLogs(1); // Reset to first page
  };

  // Reset to default filters
  const resetFilters = () => {
    const reset = {};
    Object.keys(tempFilters).forEach(key => {
      reset[key] = true;
    });
    setTempFilters(reset);
    setActionFilters(reset);
    fetchLogs(1);
  };

  // Group actions by category for display
  const groupedActions = useMemo(() => {
    return {
      'User Actions': [1, 2, 3],
      'System Actions': [4, 5, 6, 7, 8, 9, 10, 11],
      'Activity Tracking': [12, 13, 14]
    };
  }, []);

  // ... rest of component ...

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>System Logs</h2>
        <button className="filter-toggle" onClick={toggleFilters}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
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
      
      {/* ... existing tabs and tables ... */}
    </div>
  );
};

export default Logs;