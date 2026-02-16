import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect, useState } from 'react';
import './styles/mobile-optimization.css';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

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

  useEffect(() => {
    if (authError?.type === 'auth_required' && !hasStartedLoginRedirect) {
      setHasStartedLoginRedirect(true);
      navigateToLogin();
    }
  }, [authError, hasStartedLoginRedirect, navigateToLogin]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <FullPageStatus title="Loading your workspace" description="Please wait while we check authentication and project settings." showSpinner />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <FullPageStatus
          title="Signing you in"
          description="Redirecting you to the login page. If nothing happens, click below."
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

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
