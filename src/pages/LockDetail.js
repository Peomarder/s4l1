// src/pages/LockDetail.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LockDetail.css';
import { authFetch,getCurrentUser, hasPrivilege } from '../components/Auth';

const LockDetail = () => {
  const { lockId } = useParams();
  const [lock, setLock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      const canEdit = await hasPrivilege(user?.privilege, 'editLocks');
      setCanEdit(canEdit);
    };
    
  fetchLockDetails();
    fetchUser();
  }, [lockId]);
  
  
const fetchLockDetails = async () => {
  try {
    setLoading(true);
    console.log("Fetching lock:", lockId);
    const response = await authFetch(`http://217.71.129.139:4821/api/locks/${lockId}`);
    
    if (!response.ok) {
      throw new Error(`Lock not found (ID: ${lockId})`);
    }
    
    const data = await response.json();
    console.log("Received data:", data); // Add this
    setLock(data);
    setError(null);
  } catch (error) {
    console.error('Fetch error:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};


  const handleBack = () => navigate('/');
  
const toggleLockStatus = async () => {
  if (!lock) return;
  
  try {
    const newStatus = !lock.is_open;
    const response = await authFetch(`http://217.71.129.139:4821/api/locks/${lockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      // Send isOpen instead of is_open
      body: JSON.stringify({ is_open: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Failed to update lock status');
    }

    const updatedLock = await response.json();
    setLock(updatedLock);
  } catch (error) {
    setError(error.message);
  }
};

  // Show loading state
  if (loading) {
    return (
      <div className="lock-detail-container">
        <div className="lock-card">
          <h2 className="lock-title">Loading...</h2>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="lock-detail-container">
        <div className="lock-card">
          <h2 className="lock-title">Error</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="back-button">Back to Home</button>
        </div>
      </div>
    );
  }


// Add this useEffect hook to fetch lock details when component mounts or lockId changes

  // Show lock details when data is available
  return (
    <div className="lock-detail-container">
      <div className="lock-card">
        <h2 className="lock-title">Lock Details</h2>
        
        <div className="detail-item">
          <label className="detail-label">
            Lock ID:
          </label>
          <p className="detail-value">{lock?.id_lock}</p>
        </div>
        
        <div className="detail-item">
          <label className="detail-label">
            Status:
          </label>
          <div className="status-container">
            <div className={`status-indicator ${lock?.is_open ? 'status-open' : 'status-closed'}`}></div>
            <span className={`status-text ${lock?.is_open ? 'status-open-text' : 'status-closed-text'}`}>
              {lock?.is_open ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
        
        <div className="button-container">
          {canEdit && (
          <button onClick={toggleLockStatus} className="toggle-button">
            Toggle Status
          </button>
        )}
          <button 
            onClick={handleBack}
            className="back-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockDetail;