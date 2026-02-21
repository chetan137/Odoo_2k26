import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await getCurrentUser();
        if (res.data.success) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        }
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* swallow */ }
    finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Role helpers
  const isAdmin      = user?.role === 'ADMIN';
  const isManager    = user?.role === 'MANAGER';
  const isDispatcher = user?.role === 'DISPATCHER';

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated,
      isAdmin, isManager, isDispatcher,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
