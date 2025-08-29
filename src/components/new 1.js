// src/pages/Index.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser, hasPrivilege } from '../components/Auth';

const Index = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRights, setUserRights] = useState({});
  
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setUserRights({
          viewUsers: hasPrivilege(user.privilege, 'viewUsers'),
          editUsers: hasPrivilege(user.privilege, 'editUsers'),
          viewLocks: hasPrivilege(user.privilege, 'viewLocks'),
          editLocks: hasPrivilege(user.privilege, 'editLocks')
        });
      }
    };
    fetchUser();
  }, []);

  // ... existing functions ...

  return (
    <div className="index-container">
      {userRights.viewUsers && (
        <div className="section-container">
          <h2>Users</h2>
          <table>
            {/* ... user table ... */}
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  {/* ... user fields ... */}
                  <td className="actions-cell">
                    {userRights.editUsers && (
                      <button onClick={() => deleteUser(user.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {userRights.viewLocks && (
        <div className="section-container">
          <h2>Locks</h2>
          {/* ... lock table ... */}
          <tbody>
            {locks.map((lock) => (
              <tr key={lock.id}>
                {/* ... lock fields ... */}
                <td className="actions-cell">
                  {userRights.editLocks && (
                    <>
                      <button onClick={() => updateLockStatus(lock.id, lock.is_open)}>
                        Toggle Status
                      </button>
                      <button onClick={() => deleteLock(lock.id)}>Delete</button>
                    </>
                  )}
                  <Link to={`/detail/${lock.id}`}>View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
          
          {userRights.editLocks && (
            <div className="add-lock-form">
              <h3>Add New Lock</h3>
              {/* ... add lock form ... */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};