import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getCurrentUser } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cs_editor_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyExistingSession() {
      const storedToken = localStorage.getItem('cs_editor_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        if (data.user && data.user.role === 'editor') {
          setUser(data.user);
        } else {
          // Non-editors cannot access admin
          logoutUser();
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        logoutUser();
      } finally {
        setLoading(false);
      }
    }

    verifyExistingSession();
  }, []);

  const loginUser = async (email, password) => {
    const data = await apiLogin(email, password);
    if (data.user.role !== 'editor') {
      throw new Error('Access denied: You must hold an Editor role to access the Editorial Dashboard.');
    }

    localStorage.setItem('cs_editor_token', data.token);
    localStorage.setItem('cs_editor_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logoutUser = () => {
    localStorage.removeItem('cs_editor_token');
    localStorage.removeItem('cs_editor_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user && user.role === 'editor'),
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
