import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
// SAFEGUARD: Dashboard is always the improved version. Do not remove — Base44 auto-gen often overwrites pages.config and breaks the Dashboard route.
import DashboardPage from './pages/Dashboard.ImprovedVersion';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect, useState } from 'react';
import './styles/mobile-optimization.css';
import './styles/design-system.css';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';

/** All routes go through the app (auth + app shell). No separate public website. */
function RouteGate() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <NavigationTracker />
        <Routes>
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
// SAFEGUARD: When main page is Dashboard, use real dashboard (same as route override below)
const MainPage = mainPageKey === 'Dashboard' ? DashboardPage : (mainPageKey ? Pages[mainPageKey] : null);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const FullPageStatus = ({ title, description, actionLabel, onAction, showSpinner = false }) => (
  <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-50">
    <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm text-center space-y-3">
      {showSpinner && (
        <div className="mx-auto w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
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
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [hasStartedLoginRedirect, setHasStartedLoginRedirect] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (authError?.type === 'auth_required' && !hasStartedLoginRedirect && location.pathname !== '/Login') {
      setHasStartedLoginRedirect(true);
      navigateToLogin();
    }
  }, [authError, hasStartedLoginRedirect, navigateToLogin, location.pathname]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <FullPageStatus title="Loading your workspace" description="Please wait while we check authentication and project settings." showSpinner />;
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

  // Render the main app — defensive: only render valid page components to avoid dashboard/runtime errors
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          {MainPage ? <MainPage /> : <PageNotFound />}
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => {
        // SAFEGUARD: Always use the real Dashboard so Base44 overwriting pages.config cannot break it
        const Component = path === 'Dashboard' ? DashboardPage : Page;
        const isValid = Component && typeof Component === 'function';
        return (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                {isValid ? <Component /> : <PageNotFound />}
              </LayoutWrapper>
            }
          />
        );
      })}
      {/* Lowercase redirects so /dashboard and /home always work */}
      <Route path="/dashboard" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/home" element={<Navigate to="/Home" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '';

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-slate-100" style={{ minHeight: '100vh' }}>
          <Router basename={basename}>
            <Routes>
              <Route path="*" element={<RouteGate />} />
            </Routes>
          </Router>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App
