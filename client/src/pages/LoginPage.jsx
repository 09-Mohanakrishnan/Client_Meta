import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      toast.success('Welcome back to AdFlow Manager!');
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message);
      toast.error(res.message);
    }
  };

  // Populate email if remembered
  React.useEffect(() => {
    const remembered = localStorage.getItem('remembered_email');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const fillCredentials = (presetEmail) => {
    setEmail(presetEmail);
    setPassword('Password123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        {/* Logo Head */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-black text-2xl text-white shadow-md shadow-blue-200">
            AF
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
            Sign in to AdFlow Manager
          </h2>
          <p className="mt-1.5 text-xs text-gray-500">
            Enterprise Ads Campaign Management Suite
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-500 font-medium cursor-pointer">
                Remember me
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center items-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-100 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Log In'}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill helper */}
        <div className="mt-6 border-t border-gray-150 pt-5">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sandbox Test Accounts</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              onClick={() => fillCredentials('superadmin@adflow.com')}
              className="rounded border border-gray-200 bg-gray-50/50 p-2 text-left hover:bg-gray-100 font-medium text-gray-700"
            >
              <div className="font-bold text-gray-900">SUPER ADMIN</div>
              <span>superadmin@adflow.com</span>
            </button>
            <button
              onClick={() => fillCredentials('admin@adflow.com')}
              className="rounded border border-gray-200 bg-gray-50/50 p-2 text-left hover:bg-gray-100 font-medium text-gray-700"
            >
              <div className="font-bold text-gray-900">ADMIN</div>
              <span>admin@adflow.com</span>
            </button>
            <button
              onClick={() => fillCredentials('editor@adflow.com')}
              className="rounded border border-gray-200 bg-gray-50/50 p-2 text-left hover:bg-gray-100 font-medium text-gray-700"
            >
              <div className="font-bold text-gray-900">EDITOR</div>
              <span>editor@adflow.com</span>
            </button>
            <button
              onClick={() => fillCredentials('viewer@adflow.com')}
              className="rounded border border-gray-200 bg-gray-50/50 p-2 text-left hover:bg-gray-100 font-medium text-gray-700"
            >
              <div className="font-bold text-gray-900">VIEWER</div>
              <span>viewer@adflow.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
