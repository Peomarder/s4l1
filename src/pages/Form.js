// src/pages/Form.js
import React, { useState } from 'react';
import md5 from 'md5';

const Form = ({ setCurrentUser }) => {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');

const handleSubmit = async (event) => {
event.preventDefault();

// Encrypt the password using md5
const encryptedPassword = md5(password);

// Save user data to local storage (or send it to your server)
localStorage.setItem(username, encryptedPassword);
localStorage.setItem('currentUser', username);
setCurrentUser(username);
alert('User registered successfully!');
};

return (    <div>
<form onSubmit={handleSubmit}>
<h2>Register User</h2>
<label>
Username:
<input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
</label>
<label>
Password:
<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
</label>
<button type="submit">Register</button>
</form>
    </div>);
};

export default Form;