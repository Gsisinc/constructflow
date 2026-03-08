import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { appClient as supabaseAppClient } from '@/api/appClient';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

const basePath = () => (typeof appParams.basePath === 'string' ? appParams.basePath : '');

const LOAD_TIMEOUT_MS = 8000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const loadFinishedRef = useRef(false);

  useEffect(() => {
    loadFinishedRef.current = false;
    checkAppState();
    // Prevent endless blank loading: after 12s show error so user sees something
    const t = setTimeout(() => {
      if (loadFinishedRef.current) return;
      loadFinishedRef.current = true;
      setAuthError({ type: 'unknown', message: 'Loading timed out. Check your connection and refresh.' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);

        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        loadFinishedRef.current = true;
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        loadFinishedRef.current = true;
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      loadFinishedRef.current = true;
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const PORTAL_ROLE_KEY = 'mygsis_portal_role';

  const resolveRole = async (currentUser) => {
    const email = (currentUser?.email || currentUser?.user?.email || '').trim().toLowerCase() || null;
    let role = currentUser?.role ?? null;

    if (!role && typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(PORTAL_ROLE_KEY);
        if (stored === 'technician' || stored === 'client' || stored === 'admin') role = stored;
      } catch (_) {}
    }

    if (!role && email) {
      try {
        const list = await base44.entities.Worker.list().catch(() => []);
        const arr = Array.isArray(list) ? list : [];
        const match = arr.find((w) => (w.email || '').toLowerCase() === email);
        if (match) role = 'technician';
      } catch (_) {}
    }

    if (!role && currentUser?.organization_id && email) {
      try {
        const workersWithOrg = await base44.entities.Worker.filter({ email, organization_id: currentUser.organization_id }).catch(() => []);
        if (Array.isArray(workersWithOrg) && workersWithOrg.length > 0) role = 'technician';
      } catch (_) {}
      if (!role) {
        try {
          const workersAny = await base44.entities.Worker.filter({ email }).catch(() => []);
          if (Array.isArray(workersAny) && workersAny.length > 0) role = 'technician';
        } catch (_) {}
      }
      if (!role && base44.entities.TechnicianProfile && typeof base44.entities.TechnicianProfile.filter === 'function') {
        try {
          const profiles = await base44.entities.TechnicianProfile.filter({ email }).then((r) => (Array.isArray(r) ? r : [])).catch(() => []);
          if (profiles.length > 0) role = 'technician';
        } catch (_) {}
      }
    }

    if (role === 'technician' || role === 'client') {
      try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(PORTAL_ROLE_KEY, role); } catch (_) {}
    }
    if (!role && currentUser?.organization_id) {
      role = 'technician';
      try { sessionStorage.setItem(PORTAL_ROLE_KEY, 'technician'); } catch (_) {}
    }
    if (!role) {
      role = 'technician';
      try { sessionStorage.setItem(PORTAL_ROLE_KEY, 'technician'); } catch (_) {}
    }
    return role ?? currentUser?.role ?? null;
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      let currentUser = null;
      if (supabaseAppClient.enabled && typeof supabaseAppClient.auth?.me === 'function') {
        try {
          currentUser = await supabaseAppClient.auth.me();
        } catch (_) {}
      }
      if (!currentUser) currentUser = await base44.auth.me();
      if (!currentUser) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const portal = params.get('portal');
        if (portal === 'technician' || portal === 'client') {
          try { sessionStorage.setItem(PORTAL_ROLE_KEY, portal); } catch (_) {}
        }
      }
      const role = await resolveRole(currentUser);
      const userWithRole = { ...currentUser, role };
      setUser(userWithRole);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      if (role === 'technician') {
        try {
          const base = (typeof appParams.basePath === 'string' ? appParams.basePath : '').replace(/\/$/, '') || '';
          const path = (typeof window !== 'undefined' && window.location.pathname).replace(new RegExp('^' + (base || '')), '') || '/';
          const segment = path.replace(/^\/+/, '').split('/')[0] || 'Home';
          if (segment !== 'TechnicianPortal') {
            window.location.replace(`${window.location.origin}${base}/TechnicianPortal`);
          }
        } catch (_) {}
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(PORTAL_ROLE_KEY); } catch (_) {}

    if (shouldRedirect) {
      const appRoot = `${window.location.origin}${basePath()}/`;
      base44.auth.logout(appRoot);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    const homeUrl = `${window.location.origin}${basePath()}/Home`;
    base44.auth.redirectToLogin(homeUrl);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
