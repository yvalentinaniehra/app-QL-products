import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Lỗi ứng dụng:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi</h1>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Ứng dụng đã gặp sự cố không mong muốn. Vui lòng tải lại trang để tiếp tục sử dụng.
            </p>
            {this.state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-red-400 font-mono break-all text-left">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
