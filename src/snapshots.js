import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import { classify } from './classify.js';
import { bytes } from './format.js';

const SNAPSHOT_DIR = resolve(homedir(), '.config', 'unifi-cli', 'snapshots');

export function ensureSnapshotDir() {
  if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true, mode: 0o700 });
}

export function snapshotPath(id) {
  return resolve(SNAPSHOT_DIR, `${id}.json`);
}

// Build summary from raw legacy-API client array
export function buildSummary(clients) {
  const byCategory = {};
  const byType = { wired: 0, wireless: 0 };

  for (const c of clients) {
    const cat = classify(c.name ?? c.hostname, c.mac);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    if (c.is_wired) byType.wired++; else byType.wireless++;
  }

  const sorted = [...clients].sort((a, b) => (b.tx_bytes ?? 0) - (a.tx_bytes ?? 0));

  return {
    total: clients.length,
    byType,
    byCategory,
    topTraffic: sorted.slice(0, 10).map(c => ({
      name: c.name ?? c.hostname ?? c.mac,
      mac:  c.mac,
      ip:   c.ip ?? c.last_ip ?? null,
      tx:   bytes(c.tx_bytes),
      rx:   bytes(c.rx_bytes),
      tx_bytes: c.tx_bytes ?? 0,
      rx_bytes: c.rx_bytes ?? 0,
    })),
  };
}

export function saveSnapshot(clients, label) {
  ensureSnapshotDir();
  const id = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2026-02-20T18-30-00
  const snapshot = {
    id,
    timestamp: new Date().toISOString(),
    label: label ?? null,
    summary: buildSummary(clients),
    clients,
  };
  const path = snapshotPath(id);
  writeFileSync(path, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
  return { id, path };
}

export function loadSnapshot(id) {
  const path = snapshotPath(id);
  if (!existsSync(path)) {
    console.error(`Snapshot not found: ${id}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listSnapshots() {
  ensureSnapshotDir();
  return readdirSync(SNAPSHOT_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const id = f.replace('.json', '');
      try {
        const s = JSON.parse(readFileSync(resolve(SNAPSHOT_DIR, f), 'utf8'));
        return { id, timestamp: s.timestamp, label: s.label, total: s.summary?.total ?? '?' };
      } catch {
        return { id, timestamp: null, label: null, total: '?' };
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
