import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ptcLogo from '../assets/ptc_logo.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      // Validation: prevent users from typing @pateros.edu.ph or .edu.ph
      if (email.includes('@') || email.includes('.edu.ph')) {
        setError('Username should not include @ or .edu.ph (it will be added automatically)');
        return;
      }
      
      if (!email.trim()) {
        setError('Username is required');
        return;
      }
      
      setLoading(true);
      // Auto-append @pateros.edu.ph domain
      const fullEmail = `${email}@pateros.edu.ph`;
      await signIn(fullEmail, password);
      const role = localStorage.getItem('userRole');
      if (role === 'super-admin' || role === 'admin') {
        navigate('/admin/rooms', { replace: true });
      } else if (role === 'professor') {
        navigate('/prof/today', { replace: true });
      } else {
        setError('Invalid user role');
      }
    } catch (err) {
      setError('Failed to sign in');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src={ptcLogo}
            alt="PTC Logo"
            className="h-20 w-auto mb-6"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to SmartSched
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
            Create one
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <div className="flex border border-gray-300 rounded-md shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 placeholder-gray-400 focus:outline-none sm:text-sm border-0 bg-transparent"
                    placeholder="john"
                  />
                  <div className="flex items-center px-3 py-2 text-gray-600 bg-white font-mono text-sm pointer-events-none select-none">
                    @pateros.edu.ph
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">New to SmartSched?</span>
              </div>
            </div>

            <Link
              to="/register"
              className="flex w-full justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Create an account
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}