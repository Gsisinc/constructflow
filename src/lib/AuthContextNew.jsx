import { createContext, useState, useEffect, useRef, useContext } from 'react';
import constructflowClient from '@/api/constructflowClient';

const AuthContext = createContext();

const LOAD_TIMEOUT_MS = 8000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const loadFinishedRef = useRef(false);

  // Initialize auth on mount
  useEffect(() => {
    loadFinishedRef.current = false;
    checkUserAuth();
    
    // Prevent endless blank loading: after LOAD_TIMEOUT_MS show error
    const t = setTimeout(() => {
      if (loadFinishedRef.current) return;
      loadFinishedRef.current = true;
      setAuthError({ 
        type: 'timeout', 
        message: 'Loading timed out. Check your connection and refresh.' 
      });
      setIsLoadingAuth(false);
    }, LOAD_TIMEOUT_MS);
    
    return () => clearTimeout(t);
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Check if token exists
      const token = constructflowClient.getToken();
      if (!token) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        loadFinishedRef.current = true;
        return;
      }

      // Verify token by fetching current user
      const currentUser = await constructflowClient.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      
      loadFinishedRef.current = true;
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      constructflowClient.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      loadFinishedRef.current = true;
      setIsLoadingAuth(false);
      
      if (error.message.includes('Authentication')) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const response = await constructflowClient.login(email, password);
      
      if (response.token) {
        constructflowClient.setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      }
      
      throw new Error('Login failed: No token received');
    } catch (error) {
      console.error('Login error:', error);
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed'
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await constructflowClient.logout();
      constructflowClient.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      constructflowClient.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    }
  };

  const register = async (email, password, name) => {
    try {
      setAuthError(null);
      const response = await constructflowClient.register(email, password, name);
      
      if (response.token) {
        constructflowClient.setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      }
      
      throw new Error('Registration failed: No token received');
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError({
        type: 'registration_failed',
        message: error.message || 'Registration failed'
      });
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoadingAuth,
    authError,
    login,
    logout,
    register,
    checkUserAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
