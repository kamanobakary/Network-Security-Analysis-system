import { useEffect, useState } from 'react';
import { Activity, Shield, Wifi, Globe, Lock, RefreshCw, TrendingUp, Layers, Server, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase, NetworkTraffic, SuspiciousIP } from '../lib/supabase';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

function ProtocolBar({ protocol, value, max, color }: { protocol: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-14 text-right">{protocol}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-300 w-20 text-right font-mono">{value.toLocaleString()}</span>
    </div>
  );
}

function LiveMetric({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value.toFixed(1)}<span className="text-xs font-normal text-slate-400 ml-1">{unit}</span></p>
    </div>
  );
}

export default function NetworkMonitor() {
  const [traffic, setTraffic] = useState<NetworkTraffic[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  async function load() {
    const [trafficRes, ipsRes] = await Promise.all([
      supabase.from('network_traffic').select('*').order('timestamp', { ascending: true }),
      supabase.from('suspicious_ips').select('*').order('threat_score', { ascending: false }),
    ]);
    setTraffic(trafficRes.data ?? []);
    setSuspiciousIPs(ipsRes.data ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const latest = traffic[traffic.length - 1];

  const bandwidthData = traffic.map((t, i) => ({
    time: new Date(t.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    'In': Number(t.inbound_mbps),
    'Out': Number(t.outbound_mbps),
  }));

  const protocolData = traffic.map((t, i) => ({
    time: new Date(t.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    TCP: Math.floor(t.tcp_packets / 1000),
    UDP: Math.floor(t.udp_packets / 1000),
    HTTP: t.http_requests,
    HTTPS: t.https_requests,
    DNS: t.dns_queries,
  }));

  const anomalyData = traffic.map((t, i) => ({
    time: new Date(t.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    blocked: t.blocked_connections,
    suspicious: t.suspicious_connections,
  }));

  const protocols = latest ? [
    { protocol: 'TCP', value: latest.tcp_packets, color: '#0ea5e9' },
    { protocol: 'UDP', value: latest.udp_packets, color: '#3b82f6' },
    { protocol: 'HTTP', value: latest.http_requests, color: '#f97316' },
    { protocol: 'HTTPS', value: latest.https_requests, color: '#22c55e' },
    { protocol: 'DNS', value: latest.dns_queries, color: '#a855f7' },
  ] : [];
  const maxProto = Math.max(...protocols.map(p => p.value), 1);

  const openPorts = [
    { port: 22, service: 'SSH', status: 'secure', connections: 14 },
    { port: 80, service: 'HTTP', status: 'warning', connections: 342 },
    { port: 443, service: 'HTTPS', status: 'secure', connections: 891 },
    { port: 3306, service: 'MySQL', status: 'danger', connections: 3 },
    { port: 8080, service: 'HTTP-Alt', status: 'warning', connections: 67 },
    { port: 53, service: 'DNS', status: 'secure', connections: 1245 },
    { port: 21, service: 'FTP', status: 'danger', connections: 2 },
    { port: 3389, service: 'RDP', status: 'danger', connections: 1 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-10 h-10 text-sky-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading network data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Network Monitor</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time traffic analysis and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 rounded-lg text-xs transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Live metrics */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <LiveMetric label="Inbound" value={Number(latest.inbound_mbps)} unit="Mbps" color="#0ea5e9" />
          <LiveMetric label="Outbound" value={Number(latest.outbound_mbps)} unit="Mbps" color="#3b82f6" />
          <LiveMetric label="Total Packets" value={latest.total_packets / 1000} unit="K/s" color="#22c55e" />
          <LiveMetric label="HTTP Req/s" value={latest.http_requests} unit="req/s" color="#f97316" />
          <LiveMetric label="Blocked" value={latest.blocked_connections} unit="conn" color="#ef4444" />
          <LiveMetric label="Suspicious" value={latest.suspicious_connections} unit="conn" color="#eab308" />
        </div>
      )}

      {/* Bandwidth & Protocol charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-sky-400" /> Bandwidth Usage (24h)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={bandwidthData}>
              <defs>
                <linearGradient id="bwIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bwOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} unit=" Mbps" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="In" stroke="#0ea5e9" fill="url(#bwIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="Out" stroke="#3b82f6" fill="url(#bwOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-sky-400 inline-block" /> Inbound</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Outbound</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" /> Protocol Traffic (24h)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={protocolData.slice(-12)}>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {['HTTPS', 'HTTP', 'DNS'].map((p, i) => (
                <Line key={p} type="monotone" dataKey={p} stroke={['#22c55e', '#f97316', '#a855f7'][i]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-2 flex-wrap">
            {['HTTPS', 'HTTP', 'DNS'].map((p, i) => (
              <div key={p} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: ['#22c55e', '#f97316', '#a855f7'][i] }} />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol breakdown + anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" /> Current Protocol Mix
          </h3>
          <div className="space-y-3">
            {protocols.map(p => (
              <ProtocolBar key={p.protocol} protocol={p.protocol} value={p.value} max={maxProto} color={p.color} />
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Anomaly Detection (24h)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={anomalyData.slice(-12)}>
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="blocked" fill="#ef4444" radius={2} />
              <Bar dataKey="suspicious" fill="#eab308" radius={2} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 bg-red-400 rounded-sm inline-block" /> Blocked</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 bg-yellow-400 rounded-sm inline-block" /> Suspicious</div>
          </div>
        </div>

        {/* Open ports */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" /> Open Ports
          </h3>
          <div className="space-y-2">
            {openPorts.map(p => (
              <div key={p.port} className="flex items-center gap-3 py-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'secure' ? 'bg-emerald-400' : p.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="font-mono text-xs text-slate-300 w-12">{p.port}</span>
                <span className="text-xs text-slate-400 flex-1">{p.service}</span>
                <span className="text-xs text-slate-500">{p.connections} conn</span>
                {p.status === 'danger' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suspicious IPs */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-red-400" /> Top Suspicious IPs
          </h3>
          <span className="text-xs text-slate-400">{suspiciousIPs.length} tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <th className="pb-2 text-left font-medium">IP Address</th>
                <th className="pb-2 text-left font-medium">Threat Score</th>
                <th className="pb-2 text-left font-medium">Attacks</th>
                <th className="pb-2 text-left font-medium">Country</th>
                <th className="pb-2 text-left font-medium">Last Seen</th>
                <th className="pb-2 text-left font-medium">Tags</th>
                <th className="pb-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {suspiciousIPs.map(ip => (
                <tr key={ip.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-mono text-sky-400">{ip.ip_address}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${ip.threat_score}%`,
                          backgroundColor: ip.threat_score >= 80 ? '#ef4444' : ip.threat_score >= 60 ? '#f97316' : '#eab308'
                        }} />
                      </div>
                      <span className={`font-semibold ${ip.threat_score >= 80 ? 'text-red-400' : ip.threat_score >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {ip.threat_score}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-300">{ip.attack_count}</td>
                  <td className="py-2.5 text-slate-400">{ip.country}</td>
                  <td className="py-2.5 text-slate-500">{new Date(ip.last_seen).toLocaleString()}</td>
                  <td className="py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {ip.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5">
                    {ip.is_blocked
                      ? <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">Blocked</span>
                      : <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded">Monitored</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
