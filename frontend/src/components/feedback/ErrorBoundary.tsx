import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('[React Error Boundary]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="ui-panel p-4 my-4 text-center">
          <div className="text-danger mb-2" style={{ fontSize: '2rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h4 className="text-main fw-bold">Telemetry Pane Component Error</h4>
          <p className="dim-sm mb-3">{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button
            className="btn-ui btn-primary-ui"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry Component Render
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
