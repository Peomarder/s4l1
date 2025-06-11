// src/pages/LockDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
        const response = await fetch(`http://localhost:5000/locks/${lockId}`);
        
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
      <div className="container mx-auto p-4 text-center">
        <p className="text-lg">Loading lock details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={handleBack}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Lock Details</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Lock ID:
          </label>
          <p className="text-gray-900 text-xl">{lock.id}</p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Status:
          </label>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${lock.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-semibold ${lock.isOpen ? 'text-green-700' : 'text-red-700'}`}>
              {lock.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockDetail;