import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bug, RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Log to console and external service
    console.error('ErrorBoundary caught:', error, errorInfo);

    // You could send this to Sentry or another error tracking service
    // logErrorToService(error, errorInfo, this.state.errorId);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <Card className="max-w-lg border-red-200 shadow-2xl">
            <CardContent className="p-8 space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Oops! Something went wrong
                </h1>
                <p className="text-slate-600 text-sm">
                  We've logged this error and our team will look into it.
                </p>
              </div>

              {/* Error ID */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Error ID</p>
                <code className="text-sm font-mono text-slate-700">
                  {this.state.errorId ?? 'unknown'}
                </code>
              </div>

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
                with Error ID: {this.state.errorId ?? 'unknown'}
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