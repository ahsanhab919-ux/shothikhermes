"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

/**
 * Props for EditingErrorBoundary component
 */
interface Props {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI to display on error */
  fallback?: ReactNode;
  /** Optional context for error logging (slideId, elementPath, operation) */
  context?: {
    slideId?: string;
    elementPath?: string;
    operation?: string;
    componentName?: string;
  };
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for editing components
 *
 * Catches errors in editing components and displays a fallback UI.
 * Provides enhanced error logging with context information.
 *
 * Features:
 * - Catches React errors in child components
 * - Logs errors with context (slideId, elementPath, operation)
 * - Provides error recovery (Try Again button)
 * - Shows error details in development mode
 * - Supports custom fallback UI
 *
 * @example
 * ```tsx
 * <EditingErrorBoundary
 *   context={{
 *     slideId: "slide-1",
 *     elementPath: "div.my-element",
 *     operation: "text-edit",
 *     componentName: "EditingToolbar"
 *   }}
 * >
 *   <EditingToolbar ... />
 * </EditingErrorBoundary>
 * ```
 */
export class EditingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging with context
    const context = this.props.context || {};
    const errorContext = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        slideId: context.slideId || "unknown",
        elementPath: context.elementPath || "unknown",
        operation: context.operation || "unknown",
        componentName: context.componentName || "unknown",
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== "undefined"
            ? window.navigator.userAgent
            : "unknown",
        url: typeof window !== "undefined" ? window.location.href : "unknown",
      },
    };

    // Log error with full context
    console.error("[EditingErrorBoundary] Error caught:", errorContext);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
    // Example:
    // if (typeof window !== "undefined" && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       editing: errorContext.context,
    //     },
    //     extra: errorContext,
    //   });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card className="border-destructive m-4">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Editing Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              An error occurred while editing. Your work is saved. Please try
              again or refresh the page.
            </p>

            {this.props.context?.componentName && (
              <p className="text-muted-foreground mb-2 text-xs">
                Component: {this.props.context.componentName}
                {this.props.context.operation &&
                  ` • Operation: ${this.props.context.operation}`}
              </p>
            )}

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-4">
                <summary className="mb-2 cursor-pointer text-sm font-medium">
                  Error Details (Development Only)
                </summary>
                <pre className="bg-muted max-h-40 overflow-auto rounded p-2 text-xs">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
