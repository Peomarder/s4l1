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
    fetchLockDetails();
  }, [lockId]);

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


  const handleBack = () => navigate('/');

  // ADDED: Toggle function for detail page
  const toggleLockStatus = async () => {
    if (!lock) return;
    
    try {
      const newStatus = !lock.isOpen;
      const response = await fetch(`http://217.71.129.139:4821/api/locks/${lockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus }),
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


  if (loading) {
    return (
    <div className="lock-detail-container">
      <div className="lock-card">
        <h2 className="lock-title">Lock Details</h2>
        
        <div className="detail-item">
          <label className="detail-label">
            Lock ID:
          </label>
          <p className="detail-value">{lock?.id}</p>
        </div>
        
        <div className="detail-item">
          <label className="detail-label">
            Status:
          </label>
          <div className="status-container">
            <div className={`status-indicator ${lock?.isOpen ? 'status-open' : 'status-closed'}`}></div>
            <span className={`status-text ${lock?.isOpen ? 'status-open-text' : 'status-closed-text'}`}>
              {lock?.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
        
        {/* ADDED: Toggle button */}
        <div className="button-container">
          <button 
            onClick={toggleLockStatus}
            className="toggle-button"
          >
            Toggle Status
          </button>
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