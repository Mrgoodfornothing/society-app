// src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, LayoutDashboard, Lock, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const navigate = useNavigate(); // <-- navigate hook added
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  async function submitHandler(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // If your backend is at a different origin, make sure axios baseURL is configured.
      const { data } = await axios.post('/api/users/login', { email, password });

      // Save user info for later
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token || '');

      toast.success(`Welcome back, ${data.name}!`);
      console.log('User Logged In:', data);

      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Login Failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-900 dark:opacity-20" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-indigo-900 dark:opacity-20" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-blue-900 dark:opacity-20" />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass w-full max-w-md p-8 rounded-2xl relative z-10"
      >
        {/* Theme toggle */}
        <div className="absolute top-4 right-4 flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-full border border-gray-200 dark:border-slate-600">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white shadow text-yellow-500' : 'text-gray-400'}`}
            aria-label="Light"
          >
            <Sun size={14} />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-slate-800 shadow text-blue-400' : 'text-gray-400'}`}
            aria-label="Dark"
          >
            <Moon size={14} />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-gray-200 dark:bg-slate-600 shadow text-purple-500' : 'text-gray-400'}`}
            aria-label="System"
          >
            <Monitor size={14} />
          </button>
        </div>

        {/* Logo / heading */}
        <div className="text-center mb-8 mt-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-lg shadow-indigo-500/30"
          >
            <LayoutDashboard className="text-white w-8 h-8" />
          </motion.div>

          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Society Connect
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Sign in to manage your apartment</p>
        </div>

        {/* Form */}
        <form onSubmit={submitHandler} className="space-y-5">
          <div className="relative">
            <Mail className="absolute top-3.5 left-3 text-slate-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              className="input-field pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-3.5 left-3 text-slate-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              className="input-field pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;