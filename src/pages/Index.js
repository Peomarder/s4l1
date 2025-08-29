import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser, hasPrivilege } from '../components/Auth';
import './Index.css';

const API_BASE = 'http://217.71.129.139:4821/api';

const Index = () => {
  const [users, setUsers] = useState([]);
  const [locks, setLocks] = useState([]);
  const [newLockId, setNewLockId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRights, setUserRights] = useState({
    viewUsers: false,
    editUsers: false,
    viewLocks: false,
    editLocks: false
  });

  useEffect(() => {
    const fetchUserAndRights = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        const rights = {
          viewUsers: await hasPrivilege(user.privilege, 'viewUsers'),
          editUsers: await hasPrivilege(user.privilege, 'editUsers'),
          viewLocks: await hasPrivilege(user.privilege, 'viewLocks'),
          editLocks: await hasPrivilege(user.privilege, 'editLocks')
        };
        setUserRights(rights);
		
        // Fetch data after getting user rights
        if (rights.viewUsers) fetchUsers();
        if (rights.viewLocks) fetchLocks();
      }
    };
    
    fetchUserAndRights();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authFetch(`${API_BASE}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      // Map to expected format
      const formattedUsers = data
        .sort((a, b) => a.id_user - b.id_user)
        .map(user => ({
          id: user.id_user,
          username: user.login,
          email: user.email,
          privilege_name: user.privilege_name
        }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLocks = async () => {
    try {
      const response = await authFetch(`${API_BASE}/locks`);
      if (!response.ok) {
        throw new Error('Failed to fetch locks');
      }
      const data = await response.json();
      
      // Filter out deleted locks on the client side
      const activeLocks = data.filter(lock => !lock.deleted);
      
      // Map to expected format
      const formattedLocks = activeLocks
        .sort((a, b) => a.id - b.id)
        .map(lock => ({
          id: lock.id,
          name: lock.name,
          is_open: lock.is_open
        }));
      
      setLocks(formattedLocks);
    } catch (error) {
      console.error('Error fetching locks:', error);
    }
  };

  const addUser = async (username) => {
    try {
      const response = await authFetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        console.error('Error adding user:', await response.text());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateLockStatus = async (lockId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await authFetch(`${API_BASE}/locks/${lockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: newStatus }),
      });

      if (response.ok) {
        fetchLocks(); // Refresh lock list
      } else {
        console.error('Error updating lock:', await response.text());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await authFetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        console.error('Error deleting user:', await response.text());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addLock = async (lockIdInput) => {
    const lockId = Number(lockIdInput);
    if (!lockIdInput || isNaN(lockId)) {
      alert('Lock ID must be a number');
      return;
    }
    if (lockId <= 0) {
      alert('Lock ID must be a positive number');
      return;
    }
    
    try {
      const response = await authFetch(`${API_BASE}/locks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_lock: lockId, is_open: false }),
      });

      if (response.ok) {
        fetchLocks();
        setNewLockId('');
      } else {
        console.error('Error adding lock:', await response.text());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteLock = async (lockId) => {
    try {
      const response = await authFetch(`${API_BASE}/locks/${lockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the lock from local state immediately
        setLocks(prevLocks => prevLocks.filter(lock => lock.id !== lockId));
      } else {
        console.error('Error deleting lock:', await response.text());
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="index-container">
      {userRights.viewUsers && (
        <div className="section-container">
          <h2>Users</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                {userRights.editUsers && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  {userRights.editUsers && (
                    <td className="actions-cell">
                      {!(user.privilege_name?.toLowerCase() === 'admin' && 
                         user.username?.toLowerCase() === 'admin') && (
                        <button onClick={() => deleteUser(user.id)}>Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {userRights.viewLocks && (
        <div className="section-container">
          <h2>Locks</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                {userRights.editLocks && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {locks.map((lock) => (
                <tr key={lock.id}>
                  <td>{lock.id}</td>
                  <td className={lock.is_open ? 'status-open' : 'status-closed'}>
                    {lock.is_open ? 'Open' : 'Closed'}
                  </td>
                  {userRights.editLocks && (
                    <td className="actions-cell">
                      <button onClick={() => updateLockStatus(lock.id, lock.is_open)}>
                        Toggle Status
                      </button>
                      <button onClick={() => deleteLock(lock.id)}>Delete</button>
                      <Link to={`/detail/${lock.id}`}>View Details</Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {userRights.editLocks && (
            <>
              <h3>Add New Lock</h3>
              <div className="add-lock-form">
                <input
                  type="number"
                  min="1"
                  value={newLockId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value >= 1 || value === '') {
                      setNewLockId(value);
                    }
                  }}
                  placeholder="Enter Lock ID"
                />
                <button onClick={() => addLock(newLockId)}>Add Lock</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;