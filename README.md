# unifi-cli

A Node.js CLI for querying your **Ubiquiti Dream Machine Pro** via the UniFi Network API. Inspect connected clients, devices, firewall rules, and networks directly from the terminal — with rich stats, wireless health, and snapshot diffing.

## Features

- **Client inventory** — list all connected devices with auto-categorization (Phone, TV, Camera, Thermostat, etc.)
- **Wireless health** — signal, noise, satisfaction score, TX/RX rates, roam count, AP name — sorted Poor → Good
- **Full traffic stats** — TX/RX bytes and packets, retries, WiFi band/channel/standard, VLAN, IPv6
- **Snapshots** — save network state and diff against it (appeared/disappeared clients, traffic delta)
- **Devices & firewall** — list UniFi APs/switches, firewall zones and policies, networks
- **JSON output** — every command supports `--json` for piping into `jq`

## Requirements

- Node.js 18+
- Local network access to your UniFi router
- A UniFi Network API key (see [Setup](#setup))

## Setup

### 1. Clone and install

```bash
git clone https://github.com/ipivanov333/unifi-cli.git
cd unifi-cli
npm install
```

### 2. Generate an API key

In UniFi Network: **Settings → Control Plane → Integrations → API Keys → Create**

### 3. Create the config file

Config lives outside the repo, chmod 600:

```bash
mkdir -p ~/.config/unifi-cli && chmod 700 ~/.config/unifi-cli
cp .env.example ~/.config/unifi-cli/config
chmod 600 ~/.config/unifi-cli/config
```

Edit `~/.config/unifi-cli/config`:

```ini
UNIFI_HOST=192.168.1.1        # your router's LAN IP
UNIFI_API_KEY=your_key_here   # from UniFi Network Integrations
UNIFI_SITE_NAME=default       # site name (default for single-site installs)
UNIFI_SITE_ID=                # leave blank — auto-discovered
```

### 4. Run

```bash
node index.js --help
```

---

## Commands

### `clients list`

All connected clients with hostname, IP, auto-detected category, connection type, MAC, and connected-at timestamp.

```bash
node index.js clients list
node index.js clients list --type wireless   # wireless only
node index.js clients list --type wired      # wired only
node index.js clients list --limit 10
node index.js clients list --json
```

**Example output:**

```
┌──────────────────────────────────────────┬────────────────┬─────────────────┬──────┬───────────────────┬────────────────────────┐
│ Hostname                                 │ IP Address     │ Category        │ Con  │ MAC Address       │ Connected At           │
├──────────────────────────────────────────┼────────────────┼─────────────────┼──────┼───────────────────┼────────────────────────┤
│ Nest-Thermostat-1650                     │ 192.168.x.x  │ Thermostat      │ WiFi │ 3c:31:74:xx:xx:xx │ 2/19/2026, 5:31:20 PM  │
│ Amazon Fire TV with 4K Ultra HD          │ 192.168.x.x  │ TV              │ WiFi │ b0:f7:c4:xx:xx:xx │ 3/6/2026,  4:48:07 PM  │
│ RingStickUpCam-21                        │ 192.168.x.x  │ Security Camera │ WiFi │ 64:9a:63:xx:xx:xx │ 3/10/2026, 10:16:54 AM │
│ NVIDIA Shield TV                         │ 192.168.x.x   │ TV              │ WiFi │ 00:04:4b:xx:xx:xx │ 3/11/2026, 10:00:10 PM │
│ Pihole                                   │ 192.168.x.x   │ Network         │ Wired│ b8:27:eb:xx:xx:xx │ 3/21/2026, 3:18:39 AM  │
│ bosch-dishwasher                         │ 192.168.x.x  │ Appliance       │ WiFi │ 38:b4:d3:xx:xx:xx │ 3/20/2026, 2:30:39 PM  │
└──────────────────────────────────────────┴────────────────┴─────────────────┴──────┴───────────────────┴────────────────────────┘
Showing 6 of 36 total
```

---

### `clients health`

Wireless clients sorted by health rating (Poor → Fair → Good). Shows signal, noise, satisfaction score, TX/RX rate, uptime, idle time, roam count, and which AP they're connected to.

```bash
node index.js clients health
node index.js clients health --json
```

**Example output:**

```
── Wireless Health ────────────────────────────────────────────

┌────────────────────┬────────────────┬────────┬─────────┬──────────┬──────────────┬──────────┬──────────┬─────────┬───────┬──────────────────────────┐
│ Hostname           │ IP Address     │ Health │ Signal  │ Noise    │ Satisfaction │ TX rate  │ RX rate  │ Uptime  │ Roams │ AP                       │
├────────────────────┼────────────────┼────────┼─────────┼──────────┼──────────────┼──────────┼──────────┼─────────┼───────┼──────────────────────────┤
│ my-macbook        │ 192.168.x.x  │ Fair   │ -71 dBm │ -106 dBm │ 99%          │ 243 Mbps │ 135 Mbps │ 49m     │ —     │ AP-Upstairs-Office │
│ XBOX               │ 192.168.x.x  │ Fair   │ -74 dBm │ -106 dBm │ 100%         │ 104 Mbps │ 1 Mbps   │ 6d 17h  │ —     │ AP-Upstairs-Office │
│ iPhone             │ 192.168.x.x  │ Fair   │ -75 dBm │ -103 dBm │ 100%         │ 234 Mbps │ 98 Mbps  │ 6h 29m  │ 36    │ AP-Kitchen         │
│ Nest-Thermostat    │ 192.168.x.x  │ Good   │ -61 dBm │ -103 dBm │ 96%          │ 72 Mbps  │ 72 Mbps  │ 14d 19h │ 6     │ AP-Kitchen         │
│ RokuUltra          │ 192.168.x.x  │ Good   │ -65 dBm │ -103 dBm │ 97%          │ 104 Mbps │ 130 Mbps │ 14d 19h │ —     │ AP-Kitchen         │
└────────────────────┴────────────────┴────────┴─────────┴──────────┴──────────────┴──────────┴──────────┴─────────┴───────┴──────────────────────────┘
```

Health rating: **Good** = signal ≥ -70 dBm and satisfaction ≥ 80%; **Fair** = signal ≥ -75 dBm or satisfaction ≥ 50%; **Poor** = below both thresholds.

---

### `clients stats`

Three tables of full stats for all clients, sourced from the legacy controller API:

| Table | Fields |
|-------|--------|
| **Traffic & Packets** | TX/RX bytes, TX/RX packets, TX retries, uptime — sorted by TX desc |
| **Wireless Signal & Rates** | SSID, band, channel, WiFi standard, signal dBm, noise, RSSI, TX/RX rate, satisfaction |
| **Device & Network Info** | Network, VLAN, IPv6, first/last seen, roam count, idle time |

```bash
node index.js clients stats
node index.js clients stats --json | jq '.[] | {name: .hostname, tx: .tx_bytes}'
```

---

### `clients get <uuid>`

Full detail for one client from the integration API (use the UUID from `clients list --json`).

```bash
node index.js clients get 5f9cb883-51c2-9b05-1c70-39d400000001
```

### `clients get-stats <mac>`

Full raw stats dump for one client from the legacy API, by MAC address.

```bash
node index.js clients get-stats aa:bb:cc:dd:ee:ff
```

---

### `snapshots`

Save and compare network state over time. Snapshots capture all connected clients and their traffic stats.

```bash
# Save a snapshot
node index.js snapshots create
node index.js snapshots create --label "before firmware update"

# List saved snapshots
node index.js snapshots list
```

```
┌─────────────────────┬───────────────────────┬─────────┬──────────────────────┐
│ ID                  │ Timestamp             │ Clients │ Label                │
├─────────────────────┼───────────────────────┼─────────┼──────────────────────┤
│ 2026-02-21T02-22-08 │ 2/20/2026, 6:22:08 PM │ 38      │ baseline             │
│ 2026-03-03T21-47-17 │ 3/3/2026,  1:47:17 PM │ 35      │ 2026-03-03 check     │
└─────────────────────┴───────────────────────┴─────────┴──────────────────────┘
```

```bash
# Show a snapshot summary
node index.js snapshots show 2026-02-21T02-22-08

# Compare current state against a snapshot
# Shows appeared/disappeared clients and per-client traffic delta
node index.js snapshots compare 2026-02-21T02-22-08
node index.js snapshots compare 2026-02-21T02-22-08 --json
```

Snapshots are stored in `~/.config/unifi-cli/snapshots/` (chmod 600).

---

### `devices`

```bash
node index.js devices list           # all UniFi APs, switches, gateways
node index.js devices list --json
node index.js devices get <id>       # detail for one device
```

### `firewall`

```bash
node index.js firewall zones         # firewall zone list
node index.js firewall policies      # firewall policy list
node index.js firewall zones --json
node index.js firewall policies --json
```

### `networks`

```bash
node index.js networks list
node index.js networks list --json
```

---

## JSON output and jq examples

Every command supports `--json`. Combine with `jq` for custom queries:

```bash
# Top 5 clients by traffic sent
node index.js clients stats --json | jq 'sort_by(-.tx_bytes) | .[:5] | .[] | {name: .hostname, tx_gb: (.tx_bytes / 1073741824 | round)}'

# All wireless clients with Poor or Fair health
node index.js clients health --json | jq '.[] | select(.health != "Good") | {name: .hostname, signal: .signal, health: .health}'

# Clients on a specific SSID
node index.js clients stats --json | jq '.[] | select(.ssid == "MyNetwork") | .hostname'

# New clients since a snapshot
node index.js snapshots compare 2026-02-21T02-22-08 --json | jq '.appeared[]'
```

---

## Device classification

`clients list` auto-categorizes devices by hostname pattern and MAC OUI:

| Category | Examples |
|----------|---------|
| Phone | iPhone, Pixel, Galaxy |
| Tablet | iPad |
| Computer | MacBook, Intel OUI |
| TV | LGwebOSTV, Bathroom-TV |
| Media Player | Roku, Chromecast, Shield TV |
| Gaming | Xbox, PlayStation |
| Smart Speaker | Amazon Echo, Google Home |
| Security Camera | Ring, Arlo, Eufy |
| Thermostat | Nest, Ecobee |
| Appliance | Bosch, dishwasher |
| Robot Vacuum | Shark, Roomba |
| Network | Pihole, Ripe probe |
| IoT / Smart Plug | Wemo, Espressif, Kasa |
| Printer | NPI prefix (HP), Epson, Brother |
| Server / NAS | Synology, Raspberry Pi |

---

## API notes

The tool uses two API layers against the UDM Pro:

- **Integration API** (`/proxy/network/integration/v1/`) — official, limited fields (name, IP, MAC, type)
- **Legacy controller API** (`/proxy/network/api/s/{site}/stat/sta`) — full stats: TX/RX bytes and packets, retries, signal, RSSI, noise, channel, WiFi standard, SSID, uptime, roam count, IPv6

Both use the same `X-API-Key` header over HTTPS. Self-signed cert is accepted (`rejectUnauthorized: false`).

The `siteId` is auto-discovered via `GET /sites` on first run.
