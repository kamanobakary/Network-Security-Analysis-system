import { useEffect, useState } from 'react';
import { Brain, TrendingUp, Shield, Eye, Target, Activity, CheckCircle, RefreshCw, Cpu } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase, SecurityAlert } from '../lib/supabase';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

type Anomaly = {
  id: string;
  type: string;
  description: string;
  confidence: number;
  severity: string;
  detected_at: string;
  source_ip?: string;
};

type Recommendation = {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  implemented: boolean;
};

export default function AIAnalysis() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: '1', priority: 'critical', title: 'Block Repeated Brute Force IPs', description: 'IP 192.168.1.105 has made 847 failed SSH attempts. Implement permanent IP block and alert SOC team. Consider geo-blocking the entire /24 subnet.', category: 'Firewall', implemented: false },
    { id: '2', priority: 'critical', title: 'Patch Database Server (CVE-2023-1234)', description: 'MySQL port 3306 is exposed and receiving SQL injection attempts. Immediately restrict access to trusted IPs only and apply latest security patches.', category: 'Vulnerability', implemented: false },
    { id: '3', priority: 'high', title: 'Enable Multi-Factor Authentication', description: 'Multiple accounts showing brute force patterns. Enforce MFA across all privileged accounts to prevent credential-based attacks.', category: 'Authentication', implemented: false },
    { id: '4', priority: 'high', title: 'Configure DDoS Rate Limiting', description: 'UDP flood attack detected reaching 4.7 Gbps. Deploy rate limiting rules on upstream router and configure fail2ban thresholds.', category: 'Network', implemented: false },
    { id: '5', priority: 'medium', title: 'Implement WAF Rules for XSS/SQLi', description: 'Multiple web application attacks detected. Deploy Web Application Firewall with OWASP CRS ruleset on HTTP/HTTPS endpoints.', category: 'Application', implemented: true },
    { id: '6', priority: 'medium', title: 'Disable Unnecessary Services', description: 'FTP (21) and RDP (3389) ports are open and receiving attack traffic. Disable if not required or restrict to VPN access only.', category: 'Hardening', implemented: false },
    { id: '7', priority: 'low', title: 'Enable DNS Query Logging', description: 'DNS zone transfer attempts detected. Enable comprehensive DNS logging to detect DNS tunneling and exfiltration attempts.', category: 'Monitoring', implemented: true },
    { id: '8', priority: 'low', title: 'Update Threat Intelligence Feeds', description: 'Several detected IPs match outdated threat feeds. Subscribe to additional CTI providers for improved IOC coverage.', category: 'Intelligence', implemented: false },
  ]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('security_alerts').select('*').order('timestamp', { ascending: false });
      setAlerts(data ?? []);
    }
    load();
  }, []);

  const anomalies: Anomaly[] = [
    { id: '1', type: 'Behavioral Anomaly', description: 'Unusual login pattern: 847 auth attempts from single IP in 60 seconds (baseline: <5/min)', confidence: 97, severity: 'critical', detected_at: new Date(Date.now() - 5 * 60000).toISOString(), source_ip: '192.168.1.105' },
    { id: '2', type: 'Traffic Spike', description: 'Inbound traffic 340% above 7-day baseline - probable DDoS campaign in progress', confidence: 94, severity: 'critical', detected_at: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: '3', type: 'New Attack Vector', description: 'First SQL injection attempts against database port 3306 from North Korean IP space', confidence: 91, severity: 'high', detected_at: new Date(Date.now() - 18 * 60000).toISOString(), source_ip: '203.0.113.42' },
    { id: '4', type: 'Lateral Movement', description: 'Sequential port scanning across /24 subnet detected - possible network reconnaissance', confidence: 88, severity: 'high', detected_at: new Date(Date.now() - 35 * 60000).toISOString(), source_ip: '172.16.0.88' },
    { id: '5', type: 'Data Exfiltration Risk', description: 'Unusual outbound DNS query volume: 8x normal rate, possible DNS tunneling', confidence: 76, severity: 'medium', detected_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: '6', type: 'C2 Communication', description: 'HTTP callback to known malware C2 infrastructure blocked - endpoint possibly compromised', confidence: 92, severity: 'high', detected_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  ];

  const radarData = [
    { subject: 'Brute Force', A: 82, fullMark: 100 },
    { subject: 'DDoS', A: 65, fullMark: 100 },
    { subject: 'SQLi/XSS', A: 54, fullMark: 100 },
    { subject: 'Malware', A: 43, fullMark: 100 },
    { subject: 'Port Scan', A: 71, fullMark: 100 },
    { subject: 'Phishing', A: 28, fullMark: 100 },
  ];

  const riskTrend = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    score: 30 + Math.random() * 40 + (i >= 20 ? 25 : 0),
    baseline: 45,
  }));

  const threatActors = [
    { name: 'APT-29 (Cozy Bear)', origin: 'Russia', targets: 'Government, Defense', confidence: 78, activity: 'high' },
    { name: 'Lazarus Group', origin: 'North Korea', targets: 'Finance, Crypto', confidence: 71, activity: 'medium' },
    { name: 'APT-41', origin: 'China', targets: 'Technology, Healthcare', confidence: 54, activity: 'low' },
    { name: 'Sandworm', origin: 'Russia', targets: 'Critical Infrastructure', confidence: 43, activity: 'low' },
  ];

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysisProgress(0);
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 40));
      setAnalysisProgress(i);
    }
    setAnalyzing(false);
  }

  function toggleRecommendation(id: string) {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, implemented: !r.implemented } : r));
  }

  const priorityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  const severityColor: Record<string, string> = {
    critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-emerald-400'
  };

  const implemented = recommendations.filter(r => r.implemented).length;
  const totalRecs = recommendations.length;
  const riskScore = Math.round(70 - (implemented / totalRecs) * 30 + Math.random() * 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">AI Security Analysis</h1>
          <p className="text-sm text-slate-400 mt-0.5">Machine learning threat detection and intelligent recommendations</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
        >
          {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {analyzing ? `Analyzing... ${analysisProgress}%` : 'Run AI Analysis'}
        </button>
      </div>

      {/* AI Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Risk Score', value: `${riskScore}/100`, color: riskScore >= 70 ? 'text-red-400' : riskScore >= 50 ? 'text-orange-400' : 'text-emerald-400', icon: Target },
          { label: 'Anomalies Detected', value: anomalies.length, color: 'text-yellow-400', icon: Activity },
          { label: 'AI Confidence', value: '94.2%', color: 'text-sky-400', icon: Cpu },
          { label: 'Threats Predicted', value: '3 emerging', color: 'text-orange-400', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-slate-900 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Analysis progress */}
      {analyzing && (
        <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-5 h-5 text-sky-400 animate-pulse" />
            <span className="text-sm text-white font-medium">AI Analysis in Progress</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-100" style={{ width: `${analysisProgress}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Analyzing {alerts.length} security events...</span>
            <span>{analysisProgress}%</span>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" /> Risk Score Trend (24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={riskTrend}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" stroke="#f97316" fill="url(#riskGrad)" strokeWidth={2} name="Risk Score" />
              <Area type="monotone" dataKey="baseline" stroke="#475569" fill="none" strokeDasharray="4 4" strokeWidth={1.5} name="Baseline" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" /> Threat Vector Radar
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Threat Level" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies + Threat actors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Anomalies */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-yellow-400" /> Detected Anomalies
          </h3>
          <div className="space-y-3">
            {anomalies.map(a => (
              <div key={a.id} className="flex gap-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg hover:border-slate-700/60 transition-colors">
                <div className="mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-red-400' : a.severity === 'high' ? 'bg-orange-400' : 'bg-yellow-400'} animate-pulse`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-white truncate">{a.type}</p>
                    <span className={`text-xs font-semibold flex-shrink-0 ${severityColor[a.severity]}`}>{a.confidence}%</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{a.description}</p>
                  {a.source_ip && <p className="text-xs font-mono text-sky-400 mt-1">{a.source_ip}</p>}
                  <p className="text-xs text-slate-600 mt-1">{new Date(a.detected_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat actors */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-400" /> Threat Actor Attribution
          </h3>
          <div className="space-y-3 mb-6">
            {threatActors.map(a => (
              <div key={a.name} className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.origin} · {a.targets}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.activity === 'high' ? 'bg-red-500/20 text-red-400' : a.activity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                    {a.activity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full" style={{ width: `${a.confidence}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{a.confidence}% match</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" /> AI Security Recommendations
          </h3>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(implemented / totalRecs) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400">{implemented}/{totalRecs} implemented</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {recommendations.map(rec => (
            <div key={rec.id} className={`p-4 rounded-xl border transition-all ${rec.implemented ? 'bg-slate-800/20 border-emerald-500/20 opacity-60' : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-700/60'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleRecommendation(rec.id)} className="mt-0.5 flex-shrink-0">
                  {rec.implemented
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <div className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-sky-400 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${priorityColor[rec.priority]}`}>{rec.priority}</span>
                    <span className="text-xs text-slate-500">{rec.category}</span>
                  </div>
                  <p className={`text-xs font-semibold mb-1 ${rec.implemented ? 'line-through text-slate-500' : 'text-white'}`}>{rec.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
