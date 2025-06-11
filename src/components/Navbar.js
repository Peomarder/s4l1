// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ currentUser }) => {
return (
<nav>
<ul>
<li><Link to="/">Home</Link></li>
<li><Link to="/detail">Detail</Link></li>
<li><Link to="/form">Form</Link></li>
<li>{currentUser ? `Logged in as: ${currentUser}` : 'Not logged in'}</li>
</ul>
</nav>
);
};

export default Navbar;