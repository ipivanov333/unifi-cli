export function bytes(n) {
  if (n == null) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' TB';
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + ' GB';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + ' MB';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + ' KB';
  return n + ' B';
}

export function mbps(kbps) {
  if (kbps == null) return '—';
  const mbpsVal = kbps / 1000;
  if (mbpsVal >= 1000) return (mbpsVal / 1000).toFixed(1) + ' Gbps';
  if (mbpsVal >= 1)    return mbpsVal.toFixed(0) + ' Mbps';
  return kbps.toFixed(0) + ' Kbps';
}

export function uptime(seconds) {
  if (seconds == null) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function signal(dbm) {
  if (dbm == null) return '—';
  return `${dbm} dBm`;
}

export function packets(n) {
  if (n == null) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
