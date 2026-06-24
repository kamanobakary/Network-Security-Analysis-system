import { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, Search, Clock, CheckCircle, XCircle, Edit2, Lock } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type LoginEntry = {
  id: string;
  email: string;
  ip_address: string;
  success: boolean;
  timestamp: string;
  country: string;
};

const DEMO_LOGINS: LoginEntry[] = [
  { id: '1', email: 'admin@netsec.local', ip_address: '10.10.0.1', success: true, timestamp: new Date(Date.now() - 5 * 60000).toISOString(), country: 'Internal' },
  { id: '2', email: 'analyst@netsec.local', ip_address: '10.10.0.5', success: true, timestamp: new Date(Date.now() - 30 * 60000).toISOString(), country: 'Internal' },
  { id: '3', email: 'admin@netsec.local', ip_address: '192.168.1.105', success: false, timestamp: new Date(Date.now() - 60 * 60000).toISOString(), country: 'Russia' },
  { id: '4', email: 'user@netsec.local', ip_address: '10.10.0.8', success: true, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), country: 'Internal' },
  { id: '5', email: 'admin@netsec.local', ip_address: '203.0.113.42', success: false, timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), country: 'North Korea' },
  { id: '6', email: 'analyst@netsec.local', ip_address: '10.10.0.5', success: true, timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), country: 'Internal' },
  { id: '7', email: 'unknown@hack.ru', ip_address: '192.168.1.105', success: false, timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), country: 'Russia' },
  { id: '8', email: 'admin@netsec.local', ip_address: '10.10.0.1', success: true, timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), country: 'Internal' },
];

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    analyst: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    user: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${map[role] || ''}`}>{role}</span>;
}

export default function UserManagement() {
  const { profile: currentProfile, signUp } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logins] = useState<LoginEntry[]>(DEMO_LOGINS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', role: 'analyst' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    const { error } = await signUp(newUser.email, newUser.password, newUser.fullName, newUser.role);
    if (error) {
      setAddError(error.message);
    } else {
      setShowAdd(false);
      setNewUser({ email: '', password: '', fullName: '', role: 'analyst' });
      await load();
    }
    setAddLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  }

  const filtered = profiles.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.email.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q) || p.role.includes(q);
  });

  const stats = {
    total: profiles.length,
    admins: profiles.filter(p => p.role === 'admin').length,
    analysts: profiles.filter(p => p.role === 'analyst').length,
    users: profiles.filter(p => p.role === 'user').length,
    active: profiles.filter(p => p.is_active).length,
  };

  const failedLogins = logins.filter(l => !l.success).length;
  const externalLogins = logins.filter(l => l.country !== 'Internal').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage users, roles, and authentication history</p>
        </div>
        {currentProfile?.role === 'admin' && (
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm transition-colors">
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: stats.total, color: 'text-white' },
          { label: 'Admins', value: stats.admins, color: 'text-red-400' },
          { label: 'Analysts', value: stats.analysts, color: 'text-sky-400' },
          { label: 'Users', value: stats.users, color: 'text-slate-300' },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800/50 rounded-xl p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Add user form */}
      {showAdd && (
        <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Create New User Account</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full Name</label>
              <input type="text" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="John Doe" required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@netsec.local" required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Min 8 characters" required minLength={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Role</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="admin">Administrator</option>
                <option value="analyst">Security Analyst</option>
                <option value="user">User</option>
              </select>
            </div>
            {addError && <p className="col-span-full text-xs text-red-400">{addError}</p>}
            <div className="col-span-full flex gap-3">
              <button type="submit" disabled={addLoading} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-lg text-sm transition-colors">
                {addLoading ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'users' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Users ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Login History
          {failedLogins > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{failedLogins}</span>}
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl">
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last Login</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  {currentProfile?.role === 'admin' && <th className="px-4 py-3 text-left font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading users...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sky-400 text-xs font-bold">{(p.full_name?.[0] || p.email[0]).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{p.full_name || 'Unknown'}</p>
                          <p className="text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={p.role} /></td>
                    <td className="px-4 py-3">
                      {p.is_active
                        ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                        : <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.last_login ? new Date(p.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    {currentProfile?.role === 'admin' && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleActive(p.id, p.is_active)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${p.is_active ? 'text-red-400 hover:bg-red-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                          >
                            {p.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{logins.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total Login Attempts</p>
            </div>
            <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-400">{failedLogins}</p>
              <p className="text-xs text-slate-400 mt-0.5">Failed Attempts</p>
            </div>
            <div className="bg-slate-900 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-400">{externalLogins}</p>
              <p className="text-xs text-slate-400 mt-0.5">External Login Attempts</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-semibold text-white">Authentication History</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">IP Address</th>
                    <th className="px-4 py-3 text-left font-medium">Country</th>
                    <th className="px-4 py-3 text-left font-medium">Result</th>
                    <th className="px-4 py-3 text-left font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logins.map(l => (
                    <tr key={l.id} className={`hover:bg-slate-800/30 transition-colors ${!l.success ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3 text-slate-300">{l.email}</td>
                      <td className="px-4 py-3 font-mono text-sky-400">{l.ip_address}</td>
                      <td className="px-4 py-3 text-slate-400">{l.country}</td>
                      <td className="px-4 py-3">
                        {l.success
                          ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Success</span>
                          : <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" /> Failed</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
