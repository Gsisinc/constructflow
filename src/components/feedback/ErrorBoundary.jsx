import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ErrorBoundary - Global Error Handler
 * Catches React errors and displays a user-friendly error UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `CF-ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to console
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);

    // Send error to monitoring service
    this.logError(error, errorInfo, errorId);

    // Show toast notification
    toast.error('Something went wrong', {
      description: `Error ID: ${errorId}. Our team has been notified.`,
      duration: 5000,
    });
  }

  logError = (error, errorInfo, errorId) => {
    const errorData = {
      errorId,
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      user: this.props.user?.email || 'anonymous',
    };

    // Log to console for debugging
    console.log('📋 Error logged:', errorData);

    // TODO: Send to your error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorData });
    // }

    // Send to your backend
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(() => {});
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorId = () => {
    navigator.clipboard.writeText(this.state.errorId);
    this.setState({ copied: true });
    toast.success('Error ID copied to clipboard');
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Card className="max-w-2xl w-full border-0 shadow-2xl animate-scaleIn">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-base mt-2">
                We're sorry for the inconvenience. Our team has been notified and is working on a fix.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error ID */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                    Error Reference ID
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.copyErrorId}
                    className="h-8 gap-1"
                  >
                    {this.state.copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
                <code className="block text-lg font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  {this.state.errorId}
                </code>
                <p className="text-xs text-slate-400 mt-2">
                  Please include this ID when contacting support
                </p>
              </div>

              {/* Error Details (Development Mode Only) */}
              {isDev && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
                    <Bug className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Development Mode - Error Details
                    </span>
                  </div>
                  <div className="p-4 overflow-auto max-h-64">
                    <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                      <strong>Error:</strong>\n{this.state.error?.toString()}\n\n
                      <strong>Component Stack:</strong>\n{this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full gap-2 h-12"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="w-full gap-2 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="w-full gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </Button>

              {/* Support Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Need help?{' '}
                  <a
                    href="mailto:support@constructflow.com?subject=Error%20Report%20${this.state.errorId}"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Contact Support
                  </a>{' '}
                  with Error ID: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{this.state.errorId}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async Error Boundary for data fetching
export function AsyncErrorBoundary({ children, fallback, onError }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (event) => {
      setHasError(true);
      setError(event.error);
      if (onError) onError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return fallback || (
      <Card className="m-4 border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Failed to load content</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error?.message}</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((err) => {
    console.error('Handled error:', err);
    setError(err);
    toast.error(err.message || 'An error occurred');
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

export default ErrorBoundary;
