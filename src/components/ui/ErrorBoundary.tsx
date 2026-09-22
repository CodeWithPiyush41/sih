import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-rose-200 bg-rose-50/50 text-center my-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-rose-100 rounded-full text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {this.props.fallbackTitle || 'Something went wrong loading this dashboard section.'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2 text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Retry Section</span>
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
