/*
  # Seed Demo Data for Network Security Analysis System

  Inserts realistic demonstration data including:
  - Suspicious IP addresses with threat scores
  - Security alerts of various types and severities
  - Network traffic samples over the past 24 hours
  - IDS events
  - Reports

  Note: User profiles are created on auth signup; demo data here covers security events only.
*/

-- Seed suspicious IPs
INSERT INTO suspicious_ips (ip_address, threat_score, attack_count, last_seen, first_seen, country, isp, tags, is_blocked) VALUES
('192.168.1.105', 95, 47, now() - interval '5 minutes', now() - interval '3 days', 'Russia', 'AS12345 RuNet', ARRAY['brute_force','scanner'], true),
('10.0.0.254', 88, 32, now() - interval '12 minutes', now() - interval '2 days', 'China', 'AS4134 ChinaNet', ARRAY['ddos','scanner'], true),
('203.0.113.42', 82, 28, now() - interval '25 minutes', now() - interval '4 days', 'North Korea', 'AS1234 KoreaTel', ARRAY['malware','sql_injection'], false),
('198.51.100.67', 76, 21, now() - interval '1 hour', now() - interval '5 days', 'Iran', 'AS44244 ITC', ARRAY['xss','brute_force'], false),
('172.16.0.88', 71, 18, now() - interval '2 hours', now() - interval '6 days', 'Romania', 'AS8708 RCS', ARRAY['port_scan','scanner'], false),
('185.220.101.5', 69, 15, now() - interval '3 hours', now() - interval '7 days', 'Germany', 'AS60729 Tor', ARRAY['tor_exit','scanner'], true),
('45.142.212.100', 64, 12, now() - interval '4 hours', now() - interval '8 days', 'Netherlands', 'AS206619 Serverius', ARRAY['proxy','ddos'], false),
('91.108.4.50', 58, 9, now() - interval '5 hours', now() - interval '10 days', 'Ukraine', 'AS13249 ISP', ARRAY['botnet'], false),
('176.10.104.243', 52, 7, now() - interval '6 hours', now() - interval '12 days', 'France', 'AS6939 HE', ARRAY['tor_exit'], false),
('62.102.148.69', 47, 5, now() - interval '8 hours', now() - interval '14 days', 'Sweden', 'AS29518 Bredband', ARRAY['scanner'], false)
ON CONFLICT (ip_address) DO NOTHING;

-- Seed security alerts (last 7 days, various types and severities)
INSERT INTO security_alerts (alert_id, timestamp, source_ip, dest_ip, source_port, dest_port, protocol, attack_type, severity, description, status, country, blocked) VALUES
-- Critical alerts
('ALT-001', now() - interval '2 minutes', '192.168.1.105', '10.10.0.1', 54823, 22, 'TCP', 'Brute Force', 'critical', 'SSH brute force attack detected: 847 failed login attempts in 60 seconds from single IP', 'investigating', 'Russia', true),
('ALT-002', now() - interval '8 minutes', '10.0.0.254', '10.10.0.5', 0, 80, 'UDP', 'DDoS', 'critical', 'UDP flood attack: 2.3M packets/sec targeting web server, traffic volume 4.7 Gbps', 'open', 'China', true),
('ALT-003', now() - interval '15 minutes', '203.0.113.42', '10.10.0.10', 45123, 3306, 'TCP', 'SQL Injection', 'critical', 'SQL injection attempt on database server: UNION SELECT attack detected in query parameters', 'resolved', 'North Korea', true),
('ALT-004', now() - interval '45 minutes', '192.168.1.105', '10.10.0.1', 61234, 22, 'TCP', 'Brute Force', 'critical', 'Credential stuffing attack: 1,200 authentication attempts with leaked credentials', 'resolved', 'Russia', true),
('ALT-005', now() - interval '1 hour 20 minutes', '10.0.0.254', '10.10.0.0/24', 0, 0, 'ICMP', 'DDoS', 'critical', 'ICMP flood detected: ping-of-death variant, 500k packets/sec across network segment', 'resolved', 'China', true),

-- High severity alerts
('ALT-006', now() - interval '30 minutes', '198.51.100.67', '10.10.0.8', 52341, 443, 'HTTPS', 'XSS', 'high', 'Stored XSS payload detected in user input field: <script>document.cookie exfiltration attempt', 'investigating', 'Iran', false),
('ALT-007', now() - interval '55 minutes', '172.16.0.88', '10.10.0.0/24', 44321, 0, 'TCP', 'Port Scanning', 'high', 'Systematic port scan: 65535 ports scanned in 120 seconds, SYN scan technique detected', 'resolved', 'Romania', true),
('ALT-008', now() - interval '1 hour 10 minutes', '203.0.113.42', '10.10.0.12', 55678, 8080, 'HTTP', 'Malware', 'high', 'Malware download attempt blocked: known C2 server communication, Emotet variant detected', 'resolved', 'North Korea', true),
('ALT-009', now() - interval '2 hours', '185.220.101.5', '10.10.0.3', 47823, 21, 'TCP', 'Brute Force', 'high', 'FTP brute force: 234 attempts in 5 minutes, targeting administrative credentials', 'investigating', 'Germany', false),
('ALT-010', now() - interval '2 hours 30 minutes', '45.142.212.100', '10.10.0.0/24', 0, 0, 'UDP', 'DDoS', 'high', 'DNS amplification attack: exploiting open resolvers, amplification factor 50x', 'resolved', 'Netherlands', true),
('ALT-011', now() - interval '3 hours', '198.51.100.67', '10.10.0.5', 51234, 3306, 'TCP', 'SQL Injection', 'high', 'Blind SQL injection detected: time-based extraction attempt on user table', 'open', 'Iran', false),
('ALT-012', now() - interval '3 hours 30 minutes', '91.108.4.50', '10.10.0.7', 56789, 80, 'HTTP', 'XSS', 'high', 'Reflected XSS in search parameter: JavaScript injection with cookie theft payload', 'resolved', 'Ukraine', true),

-- Medium severity alerts
('ALT-013', now() - interval '4 hours', '176.10.104.243', '10.10.0.4', 43210, 22, 'TCP', 'Brute Force', 'medium', 'SSH login failures: 45 failed attempts from Tor exit node, likely automated scanner', 'open', 'France', false),
('ALT-014', now() - interval '4 hours 30 minutes', '62.102.148.69', '10.10.0.0/24', 54321, 0, 'TCP', 'Port Scanning', 'medium', 'Service version scan: Nmap OS detection attempted on 20 hosts', 'open', 'Sweden', false),
('ALT-015', now() - interval '5 hours', '172.16.0.88', '10.10.0.9', 48765, 80, 'HTTP', 'SQL Injection', 'medium', 'Error-based SQL injection probe: testing for MySQL error disclosure in web app', 'resolved', 'Romania', false),
('ALT-016', now() - interval '5 hours 30 minutes', '192.168.1.105', '10.10.0.6', 57890, 445, 'TCP', 'Malware', 'medium', 'SMB exploitation attempt: EternalBlue vulnerability probe on Windows shares', 'investigating', 'Russia', false),
('ALT-017', now() - interval '6 hours', '10.0.0.254', '10.10.0.1', 61234, 3389, 'TCP', 'Brute Force', 'medium', 'RDP brute force: 78 authentication attempts targeting remote desktop service', 'resolved', 'China', true),
('ALT-018', now() - interval '6 hours 30 minutes', '203.0.113.42', '10.10.0.8', 44321, 443, 'HTTPS', 'XSS', 'medium', 'DOM-based XSS attempt: hash fragment injection in single-page application', 'open', 'North Korea', false),
('ALT-019', now() - interval '7 hours', '45.142.212.100', '10.10.0.2', 52876, 25, 'TCP', 'Malware', 'medium', 'SMTP relay abuse attempt: botnet trying to use mail server as spam relay', 'resolved', 'Netherlands', true),
('ALT-020', now() - interval '8 hours', '185.220.101.5', '10.10.0.11', 49876, 8443, 'HTTPS', 'Port Scanning', 'medium', 'HTTPS service enumeration: directory traversal probes on web application', 'open', 'Germany', false),

-- Low severity alerts
('ALT-021', now() - interval '9 hours', '176.10.104.243', '10.10.0.4', 45678, 80, 'HTTP', 'Port Scanning', 'low', 'Web crawler with suspicious user-agent string: possible reconnaissance activity', 'open', 'France', false),
('ALT-022', now() - interval '10 hours', '62.102.148.69', '10.10.0.1', 54123, 53, 'UDP', 'Port Scanning', 'low', 'DNS zone transfer attempt: AXFR request to DNS server, potential info gathering', 'resolved', 'Sweden', false),
('ALT-023', now() - interval '11 hours', '91.108.4.50', '10.10.0.5', 56234, 80, 'HTTP', 'SQL Injection', 'low', 'SQL comment injection probe: testing for basic SQL vulnerabilities with comment syntax', 'open', 'Ukraine', false),
('ALT-024', now() - interval '12 hours', '198.51.100.67', '10.10.0.3', 47123, 22, 'TCP', 'Brute Force', 'low', 'SSH version fingerprinting: banner grabbing from known scanner IP range', 'open', 'Iran', false),
('ALT-025', now() - interval '1 day', '172.16.0.88', '10.10.0.7', 58901, 80, 'HTTP', 'XSS', 'low', 'Basic XSS test string in URL parameter: automated vulnerability scanner detected', 'resolved', 'Romania', false),
('ALT-026', now() - interval '1 day 2 hours', '192.168.1.105', '10.10.0.9', 43567, 443, 'HTTPS', 'Malware', 'low', 'Suspicious outbound connection to known threat intelligence feed - watchlisted domain', 'open', 'Russia', false),
('ALT-027', now() - interval '1 day 6 hours', '10.0.0.254', '10.10.0.2', 62345, 80, 'HTTP', 'Port Scanning', 'low', 'HTTP method enumeration: OPTIONS and TRACE methods being tested systematically', 'resolved', 'China', false),
('ALT-028', now() - interval '2 days', '203.0.113.42', '10.10.0.6', 51234, 8080, 'HTTP', 'SQL Injection', 'low', 'Parameter pollution attempt: duplicate parameters with SQL syntax in web request', 'resolved', 'North Korea', false),
('ALT-029', now() - interval '2 days 12 hours', '185.220.101.5', '10.10.0.8', 47890, 443, 'HTTPS', 'XSS', 'low', 'JavaScript injection in referrer header: potential XSS via HTTP headers', 'open', 'Germany', false),
('ALT-030', now() - interval '3 days', '45.142.212.100', '10.10.0.10', 55432, 3306, 'TCP', 'Malware', 'low', 'Database connection from unauthorized IP range: anomalous access pattern detected', 'resolved', 'Netherlands', false)
ON CONFLICT (alert_id) DO NOTHING;

-- Seed network traffic (hourly data for last 24 hours)
INSERT INTO network_traffic (timestamp, inbound_mbps, outbound_mbps, total_packets, tcp_packets, udp_packets, http_requests, https_requests, dns_queries, blocked_connections, suspicious_connections)
SELECT
  now() - (i || ' hours')::interval,
  round((40 + random() * 60 + CASE WHEN i % 6 = 0 THEN random() * 400 ELSE 0 END)::numeric, 2),
  round((20 + random() * 40 + CASE WHEN i % 8 = 0 THEN random() * 200 ELSE 0 END)::numeric, 2),
  (500000 + (random() * 200000)::bigint),
  (350000 + (random() * 150000)::bigint),
  (100000 + (random() * 80000)::bigint),
  (8000 + (random() * 4000)::bigint),
  (15000 + (random() * 6000)::bigint),
  (3000 + (random() * 2000)::bigint),
  (10 + (random() * 50)::integer),
  (5 + (random() * 20)::integer)
FROM generate_series(0, 23) AS i;

-- Seed IDS events
INSERT INTO ids_events (timestamp, event_type, source_ip, target_ip, port, protocol, confidence, blocked) VALUES
('now'::timestamptz - interval '3 minutes', 'Brute Force', '192.168.1.105', '10.10.0.1', 22, 'TCP', 97, true),
('now'::timestamptz - interval '10 minutes', 'DDoS', '10.0.0.254', '10.10.0.5', 80, 'UDP', 94, true),
('now'::timestamptz - interval '18 minutes', 'SQL Injection', '203.0.113.42', '10.10.0.10', 3306, 'TCP', 91, true),
('now'::timestamptz - interval '35 minutes', 'Port Scanning', '172.16.0.88', '10.10.0.0', 0, 'TCP', 88, false),
('now'::timestamptz - interval '1 hour', 'XSS', '198.51.100.67', '10.10.0.8', 443, 'HTTPS', 85, false),
('now'::timestamptz - interval '1 hour 30 minutes', 'Malware', '203.0.113.42', '10.10.0.12', 8080, 'HTTP', 92, true),
('now'::timestamptz - interval '2 hours', 'Brute Force', '185.220.101.5', '10.10.0.3', 21, 'TCP', 78, false),
('now'::timestamptz - interval '3 hours', 'DDoS', '45.142.212.100', '10.10.0.5', 53, 'UDP', 89, true),
('now'::timestamptz - interval '4 hours', 'SQL Injection', '198.51.100.67', '10.10.0.5', 3306, 'TCP', 82, false),
('now'::timestamptz - interval '5 hours', 'Port Scanning', '62.102.148.69', '10.10.0.0', 0, 'TCP', 75, false),
('now'::timestamptz - interval '6 hours', 'Brute Force', '192.168.1.105', '10.10.0.1', 3389, 'TCP', 83, true),
('now'::timestamptz - interval '8 hours', 'XSS', '91.108.4.50', '10.10.0.7', 80, 'HTTP', 79, true);

-- Seed reports
INSERT INTO reports (title, report_type, period_start, period_end, total_events, critical_alerts, high_alerts, medium_alerts, low_alerts, attacks_blocked, summary) VALUES
('Daily Security Report - ' || to_char(now(), 'YYYY-MM-DD'), 'daily', now() - interval '1 day', now(), 30, 5, 7, 8, 10, 18, 'Daily security analysis shows elevated threat activity from Eastern European and Asian IP ranges. 5 critical incidents required immediate response. DDoS mitigation successfully deployed. Recommend reviewing firewall rules for port 22 and 3306.'),
('Weekly Security Report - Week ' || to_char(now(), 'IW'), 'weekly', now() - interval '7 days', now(), 142, 18, 34, 52, 38, 87, 'Weekly summary indicates 23% increase in brute force attacks compared to previous week. SQL injection attempts targeting database servers remain high priority. IDS blocked 87 confirmed attacks. Recommend implementing rate limiting and geo-blocking for high-risk regions.'),
('Monthly Security Report - ' || to_char(now(), 'Month YYYY'), 'monthly', now() - interval '30 days', now(), 612, 67, 143, 218, 184, 389, 'Monthly analysis reveals persistent threat actor campaigns from multiple nation-state attributed sources. Total 612 security events processed, 389 blocked automatically. Critical infrastructure remained secure. AI anomaly detection identified 3 zero-day indicators requiring further investigation.');
