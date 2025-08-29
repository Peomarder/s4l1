import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser,authFetch, authEmitter } from '../components/Auth';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Get current location

  const logPageView = async (pageName) => {
    try {
      await authFetch('http://217.71.129.139:4821/api/system-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: 12, // Page View
          endpoint: pageName,
          details: `User viewed ${pageName} page`
        })
      });
    } catch (error) {
      console.error('Failed to log page view:', error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        // Log page view after user is fetched
        if (user) {
          logPageView(location.pathname);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for authentication changes
    const authListener = () => {
      fetchUser();
    };

    authEmitter.on('authChange', authListener);

    return () => {
      authEmitter.off('authChange', authListener);
    };
  },  [location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      // The authEmitter event will trigger the state update
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <ul className="nav-list">
          <li><Link to="/landing">Home</Link></li>
          <li><Link to="/">Index</Link></li>
          {/* Add Register link only for Admins */}
          {currentUser?.privilege?.toLowerCase() === 'admin' && (
         <> <li><Link to="/logs">Journal</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>)}
          <li className="user-info">
            {loading ? (
              <div>Loading user...</div>
            ) : currentUser ? (
              <>
                <span>Logged in as: {currentUser.username}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </li>
          {currentUser && (
            <li>
              <div className="user-info">
                <span>Welcome, {currentUser.name || currentUser.login} </span>
                <span>Privilege: {currentUser.privilege}</span>
              </div>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;