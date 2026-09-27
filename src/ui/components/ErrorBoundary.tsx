import { Component, type ReactNode } from "react";

import { ErrorPanel } from "./ErrorPanel.js";

interface ErrorBoundaryProps {
  readonly isRoot?: boolean;
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly error: unknown;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  override render() {
    if (this.state.error !== null) {
      return this.props.isRoot ? (
        <div className="page">
          <ErrorPanel error={this.state.error} />
        </div>
      ) : (
        <ErrorPanel error={this.state.error} />
      );
    }
    return this.props.children;
  }
}
