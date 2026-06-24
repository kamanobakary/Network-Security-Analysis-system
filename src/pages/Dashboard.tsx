import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Wifi, TrendingUp, Eye, Zap, Globe, Clock, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { supabase, SecurityAlert, NetworkTraffic } from '../lib/supabase';

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const ATTACK_COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

type Stats = {
  totalEvents: number;
  attacksDetected: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  monitoredIPs: number;
  blockedToday: number;
};

function StatCard({ title, value, icon: Icon, color, trend, sub }: {
  title: string; value: string | number; icon: React.ElementType;
  color: string; trend?: number; sub?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5 hover:border-slate-700/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-400">{title}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${map[severity] || ''}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-red-500/20 text-red-400',
    investigating: 'bg-yellow-500/20 text-yellow-400',
    resolved: 'bg-emerald-500/20 text-emerald-400',
    false_positive: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] || ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [traffic, setTraffic] = useState<NetworkTraffic[]>([]);
  const [stats, setStats] = useState<Stats>({ totalEvents: 0, attacksDetected: 0, critical: 0, high: 0, medium: 0, low: 0, monitoredIPs: 0, blockedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [alertsRes, trafficRes] = await Promise.all([
        supabase.from('security_alerts').select('*').order('timestamp', { ascending: false }),
        supabase.from('network_traffic').select('*').order('timestamp', { ascending: true }),
      ]);

      const alertData = alertsRes.data ?? [];
      const trafficData = trafficRes.data ?? [];

      setAlerts(alertData);
      setTraffic(trafficData);

      const critical = alertData.filter(a => a.severity === 'critical').length;
      const high = alertData.filter(a => a.severity === 'high').length;
      const medium = alertData.filter(a => a.severity === 'medium').length;
      const low = alertData.filter(a => a.severity === 'low').length;
      const uniqueIPs = new Set([...alertData.map(a => a.source_ip), ...alertData.map(a => a.dest_ip)]).size;
      const blockedToday = alertData.filter(a => a.blocked && new Date(a.timestamp) > new Date(Date.now() - 86400000)).length;

      setStats({ totalEvents: alertData.length, attacksDetected: critical + high, critical, high, medium, low, monitoredIPs: uniqueIPs, blockedToday });
      setLoading(false);
    }
    load();
  }, []);

  const alertsByHour = traffic.slice(-12).map((t, i) => ({
    time: `${23 - (11 - i)}:00`,
    critical: Math.floor(Math.random() * 3),
    high: Math.floor(Math.random() * 5),
    medium: Math.floor(Math.random() * 8),
    low: Math.floor(Math.random() * 10),
  }));

  const bandwidthData = traffic.slice(-12).map((t, i) => ({
    time: `${23 - (11 - i)}:00`,
    'Inbound (Mbps)': t.inbound_mbps,
    'Outbound (Mbps)': t.outbound_mbps,
  }));

  const attackTypeData = (() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.attack_type] = (counts[a.attack_type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  })();

  const severityData = [
    { name: 'Critical', value: stats.critical, color: '#ef4444' },
    { name: 'High', value: stats.high, color: '#f97316' },
    { name: 'Medium', value: stats.medium, color: '#eab308' },
    { name: 'Low', value: stats.low, color: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Shield className="w-10 h-10 text-sky-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Security Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time network security monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Alert banner */}
      {stats.critical > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
          <p className="text-sm text-red-300 flex-1">
            <strong className="font-semibold">{stats.critical} critical threats</strong> detected and requiring immediate attention
          </p>
          <button className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Security Events" value={stats.totalEvents} icon={Shield} color="bg-sky-500/20 text-sky-400" trend={12} />
        <StatCard title="Attacks Detected" value={stats.attacksDetected} icon={AlertTriangle} color="bg-red-500/20 text-red-400" trend={8} sub="Critical + High" />
        <StatCard title="IPs Monitored" value={stats.monitoredIPs} icon={Globe} color="bg-blue-500/20 text-blue-400" sub="Unique addresses" />
        <StatCard title="Attacks Blocked Today" value={stats.blockedToday} icon={Zap} color="bg-emerald-500/20 text-emerald-400" trend={-5} />
      </div>

      {/* Severity breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Critical', count: stats.critical, color: 'bg-red-500/10 border-red-500/30 text-red-400' },
          { label: 'High', count: stats.high, color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
          { label: 'Medium', count: stats.medium, color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
          { label: 'Low', count: stats.low, color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color} bg-opacity-10`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs mt-0.5 opacity-80">{label} Severity</p>
            <div className="mt-2 h-1 bg-current/20 rounded-full">
              <div className="h-full bg-current rounded-full" style={{ width: `${Math.min((count / stats.totalEvents) * 100, 100)}%`, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alert timeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Alert Timeline (12h)</h3>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={alertsByHour}>
              <defs>
                {['critical', 'high', 'medium', 'low'].map((s, i) => (
                  <linearGradient key={s} id={`g${s}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={Object.values(SEVERITY_COLORS)[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={Object.values(SEVERITY_COLORS)[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {['critical', 'high', 'medium', 'low'].map((s, i) => (
                <Area key={s} type="monotone" dataKey={s} stackId="1"
                  stroke={Object.values(SEVERITY_COLORS)[i]} fill={`url(#g${s})`}
                  strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Severity Distribution</h3>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {severityData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-400">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bandwidth */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Network Bandwidth (24h)</h3>
            <Wifi className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={bandwidthData}>
              <defs>
                <linearGradient id="gin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Inbound (Mbps)" stroke="#0ea5e9" fill="url(#gin)" strokeWidth={2} />
              <Area type="monotone" dataKey="Outbound (Mbps)" stroke="#3b82f6" fill="url(#gout)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attack types */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Attack Type Distribution</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={attackTypeData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={4}>
                {attackTypeData.map((_, i) => <Cell key={i} fill={ATTACK_COLORS[i % ATTACK_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Security Alerts</h3>
          <span className="text-xs text-sky-400">Last {Math.min(alerts.length, 8)} of {alerts.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <th className="pb-2 text-left font-medium">Time</th>
                <th className="pb-2 text-left font-medium">Source IP</th>
                <th className="pb-2 text-left font-medium">Attack Type</th>
                <th className="pb-2 text-left font-medium">Severity</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-left font-medium hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {alerts.slice(0, 8).map(alert => (
                <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 text-slate-400 whitespace-nowrap">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 font-mono text-sky-400">{alert.source_ip}</td>
                  <td className="py-2.5 text-white font-medium">{alert.attack_type}</td>
                  <td className="py-2.5"><SeverityBadge severity={alert.severity} /></td>
                  <td className="py-2.5"><StatusBadge status={alert.status} /></td>
                  <td className="py-2.5 text-slate-400 hidden md:table-cell max-w-xs truncate">{alert.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
