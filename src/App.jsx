import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect, useState } from 'react';
import './styles/mobile-optimization.css';
import './styles/design-system.css';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';
import EstimatorWizard from './pages/EstimatorWizard';

/** SPA redirect handler — restore intended path from sessionStorage */
function SPARedirectHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const url = sessionStorage.getItem('spaRedirect');
      if (!url) return;
      sessionStorage.removeItem('spaRedirect');
      const u = new URL(url);
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';
      const path = base && u.pathname.startsWith(base)
        ? u.pathname.slice(base.length) || '/'
        : u.pathname || '/';
      navigate(path + u.search + u.hash, { replace: true });
    } catch (_) {}
  }, [navigate]);
  return null;
}

const FullPageStatus = ({ title, description, actionLabel, onAction, showSpinner = false, secondaryActions }) => (
  <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-200 min-h-screen" role="status" aria-live="polite">
    <div className="w-full max-w-md rounded-xl border-2 border-slate-300 bg-white p-6 shadow-lg text-center space-y-3">
      {showSpinner && (
        <div className="mx-auto w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" aria-hidden="true" />
      )}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-600">{description}</p>}
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {actionLabel}
        </button>
      )}
      {secondaryActions && <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">{secondaryActions}</div>}
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkAppState } = useAuth();
  const [hasStartedLoginRedirect, setHasStartedLoginRedirect] = useState(false);
  const [showLoadingFallback, setShowLoadingFallback] = useState(false);

  useEffect(() => {
    if (authError?.type === 'auth_required' && !hasStartedLoginRedirect) {
      setHasStartedLoginRedirect(true);
      navigateToLogin();
    }
  }, [authError, hasStartedLoginRedirect, navigateToLogin]);

  useEffect(() => {
    if (!(isLoadingPublicSettings || isLoadingAuth)) return;
    const t = setTimeout(() => setShowLoadingFallback(true), 4000);
    return () => clearTimeout(t);
  }, [isLoadingPublicSettings, isLoadingAuth]);

  useEffect(() => {
    if (!(isLoadingPublicSettings || isLoadingAuth)) setShowLoadingFallback(false);
  }, [isLoadingPublicSettings, isLoadingAuth]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <FullPageStatus
        title="Loading your workspace"
        description="Please wait while we check authentication and project settings."
        showSpinner
        secondaryActions={showLoadingFallback && (
          <>
            <button
              type="button"
              onClick={() => { setShowLoadingFallback(false); checkAppState(); }}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={navigateToLogin}
              className="inline-flex items-center justify-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Go to sign in
            </button>
          </>
        )}
      />
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'auth_required') {
      return (
        <FullPageStatus
          title="Sign in"
          description="Redirecting to the login page. If nothing happens, click below."
          actionLabel="Go to login"
          onAction={navigateToLogin}
          showSpinner
        />
      );
    }
    return (
      <FullPageStatus
        title="We couldn't load the app"
        description={authError.message || 'An unexpected authentication error occurred.'}
        actionLabel="Try login again"
        onAction={navigateToLogin}
      />
    );
  }

  return (
    <>
      <SPARedirectHandler />
      <Routes>
        <Route path="/" element={<EstimatorWizard />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-slate-100" style={{ minHeight: '100vh', display: 'block' }}>
          <Router basename={basename}>
            <AuthProvider>
              <QueryClientProvider client={queryClientInstance}>
                <NavigationTracker />
                <Routes>
                  <Route path="*" element={<AuthenticatedApp />} />
                </Routes>
                <Toaster />
              </QueryClientProvider>
            </AuthProvider>
          </Router>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App