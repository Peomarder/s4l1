//src/components/Auth.js

//import jwt from 'jsonwebtoken';
//import md5 from 'md5';
import {jwtDecode } from 'jwt-decode'; // Replace jsonwebtoken with this

import { EventEmitter } from 'events';

export const authEmitter = new EventEmitter();

const API_BASE = 'http://217.71.129.139:4821/api';
const TOKEN_KEY = 'TOKEN_KEY';
// Add privilege rights from .env
// To this:
//const PRIVILEGE_RIGHTS = process.env.REACT_APP_PRIVILEGE_RIGHTS   ? JSON.parse(process.env.REACT_APP_PRIVILEGE_RIGHTS)  : {};


// Add privilege rights caching
let privilegeRightsCache = null;
let lastPrivilegeFetch = 0;

// Fetch privilege rights with caching
export const getPrivilegeRights = async () => {
  const now = Date.now();
  // Cache for 5 minutes (300,000 ms)
  if (privilegeRightsCache && (now - lastPrivilegeFetch < 300000)) {
    return privilegeRightsCache;
  }
  
  try {
    const response = await fetch(`${API_BASE}/privileges`);
    if (!response.ok) throw new Error('Failed to fetch privileges');
    
    const privileges = await response.json();
    // Create rights mapping
    const rightsMapping = {};
    
    privileges.forEach(priv => {
      rightsMapping[priv.name] = {
        viewUsers: priv.view_users,
        editUsers: priv.edit_users,
        viewLocks: priv.view_locks,
        editLocks: priv.edit_locks,
        viewLogs: priv.view_logs
      };
    });
    
    privilegeRightsCache = rightsMapping;
    lastPrivilegeFetch = Date.now();
    return rightsMapping;
  } catch (error) {
    console.error('Error fetching privilege rights:', error);
    // Return default rights if API fails
    return {
      'Admin': {
        viewUsers: true,
        editUsers: true,
        viewLocks: true,
        editLocks: true,
        viewLogs: true
      },
      'Employee': {
        viewLocks: true,
        editLocks: true
      },
      'Guest': {
        viewLocks: true
      }
    };
  }
};


// Unified privilege fetching function
export const fetchPrivileges = async (type = 'rights') => {
  const now = Date.now();
  
  // Use cache for rights
  if (type === 'rights' && privilegeRightsCache && (now - lastPrivilegeFetch < 300000)) {
    return privilegeRightsCache;
  }

  try {
    const response = await authFetch(`${API_BASE}/privileges`);
    if (!response.ok) throw new Error('Failed to fetch privileges');
    
    const privileges = await response.json();
    
    if (type === 'list') {
      return privileges;
    }

    // Create rights mapping
    const rightsMapping = {};
    privileges.forEach(priv => {
      rightsMapping[priv.name] = {
        viewUsers: priv.view_users,
        editUsers: priv.edit_users,
        viewLocks: priv.view_locks,
        editLocks: priv.edit_locks,
        viewLogs: priv.view_logs
      };
    });
    
    privilegeRightsCache = rightsMapping;
    lastPrivilegeFetch = Date.now();
    return rightsMapping;
    
  } catch (error) {
    console.error(`Error fetching privileges (${type}):`, error);
    
    return type === 'list' ? [] : {
      'Admin': { viewUsers: true, editUsers: true, viewLocks: true, editLocks: true, viewLogs: true },
      'Employee': { viewLocks: true, editLocks: true },
      'Guest': { viewLocks: true }
    };
  }
};

// Updated functions using the unified fetcher
export const hasPrivilege = async (privilegeName, rightName) => {
  try {
    const rightsMapping = await fetchPrivileges('rights');
    return !!rightsMapping[privilegeName]?.[rightName];
  } catch (error) {
    console.error('Error checking privilege:', error);
    return false;
  }
};

export const getPrivileges = async () => {
  return fetchPrivileges('list');
};


export const registerUser = async (username, password, email, name,privilegeId) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, name, privilegeId })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  
  const data = await response.json();
  
   // Log the registration event to system logs
  try {
    await authFetch(`${API_BASE}/system-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_id: 9, // User Creation action
        endpoint: '/api/auth/register',
        details: `New user registered: ${username} (${email}) with privilege ID: ${privilegeId}`
      })
    });
  } catch (error) {
    console.error('Failed to log registration event:', error);
    // Don't throw error as registration was successful
  }
  //localStorage.setItem(TOKEN_KEY, data.token);
      authEmitter.emit('authChange'); // Notify listeners
  return data;
};


export const loginUser = async (username, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem(TOKEN_KEY, data.token);
      authEmitter.emit('authChange'); // Notify listeners
  return data;
};

// Add token refresh function
export const refreshToken = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    return data.token;
  } catch {
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
    authEmitter.emit('authChange'); // Notify listeners
  window.location.href = '/login';
};

// Update getCurrentUser function
// Add this function to Auth.js
// Add user caching to prevent unnecessary API calls
let cachedUser = null;
let lastFetchTime = 0;


// Add this API request wrapper function
export const authFetch = async (url, options = {}) => {
  // Add authorization header
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // First try the request
  let response = await fetch(`${url}`, options);
  
  // If unauthorized, try refreshing token
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      // Retry with new token
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`
      };
      response = await fetch(`${url}`, options);
    }
  }
  
  return response;
};

// Update getCurrentUser to use authFetch
export const getCurrentUser = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  
  const now = Date.now();
  if (cachedUser && (now - lastFetchTime < 300000)) {
    return cachedUser;
  }
  
  try {
    const decoded = jwtDecode(token);
    const userId = decoded.id_user;

    // Use authFetch instead of fetch
    const response = await authFetch(`${API_BASE}/users/${userId}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        cachedUser = null;
      }
      return null;
    }
    
    const userData = await response.json();
    
    cachedUser = {
      id: userData.id_user,
      username: userData.login,
      name: userData.name,
      email: userData.email,
      privilege: userData.privilege_name
    };
    
    lastFetchTime = Date.now();
    return cachedUser;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};




export const verifyToken = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Enhanced checkAuth with token refresh
/*
export const checkAuth = async () => {
  const user = getCurrentUser();
  if (!user) {
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return false;
  }
  
  const isValid = await verifyToken();
  if (!isValid) {
    const newToken = await refreshToken();
    if (!newToken) {
      logoutUser();
      return false;
    }
  }
  
  return true;
};*/

export const checkAuth = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    // Verify token first
    const verifyResponse = await fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (verifyResponse.ok) return true;
    
    // If verification fails, try to refresh token
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    }
    
    // Both verification and refresh failed
    logoutUser();
    return false;
  } catch (error) {
    console.error('Authentication check failed:', error);
    logoutUser();
    return false;
  }
};

function redirectToLogin() {
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

