import { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('analyst');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName, role);
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  const demoAccounts = [
    { label: 'Admin', email: 'admin@netsec.local', password: 'Admin@123456', role: 'Administrator' },
    { label: 'Analyst', email: 'analyst@netsec.local', password: 'Analyst@123456', role: 'Security Analyst' },
  ];

  function fillDemo(acc: typeof demoAccounts[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setMode('login');
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sky-500/20 border border-sky-500/30 mb-4">
            <Shield className="w-10 h-10 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Network Security</h1>
          <p className="text-sky-400 text-sm font-medium mt-1 uppercase tracking-widest">Analysis System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-lg">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="analyst@netsec.local"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-colors text-sm"
                >
                  <option value="admin">Administrator</option>
                  <option value="analyst">Security Analyst</option>
                  <option value="user">User</option>
                </select>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.label}
                  onClick={() => fillDemo(acc)}
                  className="flex items-center gap-2 p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-sky-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-3 h-3 text-sky-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-white group-hover:text-sky-400 transition-colors">{acc.label}</p>
                    <p className="text-xs text-slate-500">{acc.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 text-center mt-2">Click to auto-fill credentials, then sign in or register.</p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Network Security Analysis System v2.0 &bull; Secured by TLS 1.3
        </p>
      </div>
    </div>
  );
}
