import React, { useState } from "react";
import { authService } from "../services/authService";
import { KeyRound, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setLoading(true);
    setError(null);
    const { user, error: authError } = await authService.signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    if (user) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-indigo-900/30 p-8">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-xl shadow-indigo-500/30 mb-4">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Account Hub</h1>
            <p className="text-slate-400 text-sm mt-1.5">Hệ thống quản lý tài khoản AI</p>
          </div>

          {/* Restricted access notice */}
          <div className="flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-6">
            <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-300 leading-relaxed">
              Khu vực <span className="font-semibold text-indigo-200">giới hạn truy cập</span>. Vui lòng đăng nhập bằng tài khoản được Admin cấp phép.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-indigo-800 disabled:to-violet-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-900/40 transition-all duration-200 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4.5 w-4.5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600 mt-6 leading-relaxed">
            Không có tài khoản? Liên hệ Admin để được cấp quyền truy cập.
          </p>
        </div>

        {/* Bottom attribution */}
        <p className="text-center text-[11px] text-slate-700 mt-5">
          AI Account Hub · Hệ thống quản lý bảo mật
        </p>
      </div>
    </div>
  );
};
