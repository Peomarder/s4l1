// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Form from './pages/Form';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
// Recover last logged in user from local storage
const user = localStorage.getItem('currentUser');
if (user) {
setCurrentUser(user);
}
}, []);

return (
<Router>
<Navbar currentUser={currentUser} />
<Routes>
<Route path="/" element={<Home />} />
<Route path="/detail" element={<Detail />} />
<Route path="/form" element={<Form setCurrentUser={setCurrentUser} />} />
</Routes>
</Router>
);
};

export default App;