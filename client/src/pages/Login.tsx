import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, LogIn } from 'lucide-react';
import * as api from '../services/api';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'driver'>('admin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.register({
          email,
          password,
          name,
          phone: phone || undefined,
          role: role === 'admin' ? 'ADMIN' : 'DRIVER'
        });
      }

      const response = await api.login(email, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Route based on the authenticated role (not the UI toggle).
      if (user?.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/driver');
      }
    } catch (err: any) {
      const fallback = mode === 'register'
        ? 'Registration failed. Please check details and try again.'
        : 'Login failed. Please check your credentials.';
      const message = err?.response?.data?.error || fallback;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Cure & Care Dispatch
          </h1>
          <p className="text-gray-600">
            Professional delivery tracking system
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="flex gap-2 p-1.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:text-primary-600 hover:bg-white/50'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  role === 'driver'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:text-primary-600 hover:bg-white/50'
                }`}
              >
                Driver
              </button>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="you@company.com"
                required
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="+1 555 555 5555"
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white font-bold py-3.5 px-4 rounded-xl hover:from-primary-700 hover:via-primary-600 hover:to-accent-600 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              {loading
                ? (mode === 'register' ? 'Creating Account…' : 'Signing In…')
                : (mode === 'register'
                    ? `Create ${role === 'admin' ? 'Admin' : 'Driver'} Account`
                    : `Sign In as ${role === 'admin' ? 'Admin' : 'Driver'}`
                  )}
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-primary-50 rounded-lg">
            <p className="text-xs text-primary-800 font-medium mb-2">Demo Credentials:</p>
            <p className="text-xs text-primary-700">Admin: admin@cure.com / admin123</p>
            <p className="text-xs text-primary-700">Driver: driver@cure.com / driver123</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 Cure & Care. All rights reserved.
        </p>
      </div>
    </div>
  );
}
