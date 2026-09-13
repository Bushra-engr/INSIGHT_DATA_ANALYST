import React from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AI Data Analyst Runtime Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B121E] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0F1929] border border-rose-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Application Exception Detected</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A component runtime error occurred. We caught it safely to avoid a blank screen.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-y-auto">
              {this.state.error?.toString() || 'Unknown Error'}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-glow-emerald transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache & Storage</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
