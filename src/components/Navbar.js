// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ currentUser }) => {
return (
<nav>
<ul>
<li><Link to="/landing">Home</Link></li>
<li><Link to="/">Index</Link></li>
<li><Link to="/add">Form</Link></li>
<li>{currentUser ? `Logged in as: ${currentUser}` : 'Not logged in'}</li>
</ul>
</nav>
);
};

export default Navbar;