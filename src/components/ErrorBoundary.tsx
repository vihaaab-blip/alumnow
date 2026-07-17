"use client";
import { Component } from "react";

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
          <div className="text-center max-w-md px-6">
            <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-white/40">An unexpected error occurred. Please refresh the page.</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="mt-5 px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-[10px] hover:bg-coral-light transition-colors"
            >Refresh page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
