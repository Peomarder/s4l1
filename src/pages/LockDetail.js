// src/pages/LockDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LockDetail.css'; // Import CSS file

const LockDetail = () => {
  const { lockId } = useParams();
  const [lock, setLock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLockDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://217.71.129.139:4821/api/locks/${lockId}`);
        
        if (!response.ok) {
          throw new Error(`Lock not found (ID: ${lockId})`);
        }
        
        const data = await response.json();
        setLock(data);
        setError(null);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLockDetails();
  }, [lockId]);

  const handleBack = () => navigate('/');

  if (loading) {
    return (
      <div className="lock-detail-container">
        <p className="loading-message">Loading lock details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lock-detail-container">
        <div className="error-alert">
          <p className="error-title">Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={handleBack}
          className="back-button"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="lock-detail-container">
      <div className="lock-card">
        <h2 className="lock-title">Lock Details</h2>
        
        <div className="detail-item">
          <label className="detail-label">
            Lock ID:
          </label>
          <p className="detail-value">{lock.id}</p>
        </div>
        
        <div className="detail-item">
          <label className="detail-label">
            Status:
          </label>
          <div className="status-container">
            <div className={`status-indicator ${lock.isOpen ? 'status-open' : 'status-closed'}`}></div>
            <span className={`status-text ${lock.isOpen ? 'status-open-text' : 'status-closed-text'}`}>
              {lock.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
        
        <div className="button-container">
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