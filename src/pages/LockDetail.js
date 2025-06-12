// src/pages/LockDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LockDetail = () => {
const { lockId } = useParams(); // Get the lock ID from URL parameters
const [lock, setLock] = useState(null);
const navigate = useNavigate(); // For navigation

useEffect(() => {
const fetchLockDetails = async () => {
try {
const response = await fetch(`http://localhost:5000/locks/${lockId}`);
if (response.ok) {
const data = await response.json();
setLock(data);
} else {
console.error('Error fetching lock details:', await response.text());
}
} catch (error) {
console.error('Error:', error);
}
};

fetchLockDetails();
}, [lockId]);

const handleBack = () => {
navigate('/'); // Go back to home or detail page as required
};

return (
<div>
{lock ? (
<>
<h2>Lock Details - ID: {lock.id}</h2>
<p>Status: {lock.isOpen ? 'Open' : 'Closed'}</p>
<button onClick={handleBack}>Back to Home</button>
</>
) : (
<p>Loading lock details...</p>
)}
</div>
);
};

export default LockDetail;