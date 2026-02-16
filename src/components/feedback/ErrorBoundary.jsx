import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'sonner';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send error to monitoring service (replace with your service)
    this.logError(error, errorInfo, errorId);

    // Show toast notification
    toast.error('Something went wrong', {
      description: `Error ID: ${errorId}. Our team has been notified.`,
    });
  }

  logError = (error, errorInfo, errorId) => {
    // Replace with your error logging service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, {
    //   extra: { errorInfo, errorId }
    // });
    
    // For now, just log to console
    console.log('Error logged:', {
      errorId,
      error: error?.toString(),
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Card className="max-w-lg w-full border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-slate-500">
                We're sorry for the inconvenience. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error ID */}
              <div className="bg-slate-100 rounded-lg p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Error Reference ID
                </p>
                <code className="text-sm font-mono text-slate-700">
                  {this.state.errorId}
                </code>
              </div>

              {/* Error Details (collapsible in production) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 overflow-auto max-h-48">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Development Mode - Error Details
                    </span>
                  </div>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1 gap-2"
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

              {/* Support Link */}
              <p className="text-center text-sm text-slate-500">
                Need help?{' '}
                <a
                  href="mailto:support@constructflow.com"
                  className="text-blue-600 hover:underline"
                >
                  Contact Support
                </a>{' '}
                with Error ID: {this.state.errorId}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for async error handling in functional components
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

// Async Error Boundary wrapper for data fetching
export function AsyncErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (event) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || (
      <Card className="m-4 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Failed to load content</h3>
              <p className="text-sm text-red-600">{error?.message}</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            size="sm"
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

export default ErrorBoundary;
