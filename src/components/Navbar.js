// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';


const Navbar = ({ currentUser }) => {
  return (
    <nav>
      <ul>
        <li><Link to="/landing">Home</Link></li>
        <li><Link to="/">Detail</Link></li>
        <li><Link to="/add">Form</Link></li>
        {/* Removed invalid LockDetail link - we don't need it in navbar */}
        <li>{currentUser ? `Logged in as: ${currentUser}` : 'Not logged in'}</li>
      </ul>
    </nav>
  );
};

export default Navbar;