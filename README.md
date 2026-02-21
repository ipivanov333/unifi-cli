# unifi-cli

A Node.js command-line tool for querying your **Ubiquiti Dream Machine Pro** via the UniFi Network API. Inspect connected clients, devices, firewall rules, and networks directly from the terminal.

## Requirements

- Node.js 18+
- Access to your UniFi router on the local network
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

Config lives outside the repo, protected to your user only:

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

### Clients

```bash
# Overview: name, category, IP, MAC, connection type
node index.js clients list
node index.js clients list --type wireless
node index.js clients list --type wired
node index.js clients list --json

# Full stats: traffic, signal, rates, uptime (3 tables)
node index.js clients stats
node index.js clients stats --json

# Detail for one client (integration API, by UUID)
node index.js clients get <uuid>

# All raw stats for one client (legacy API, by MAC)
node index.js clients get-stats <mac>
```

### Devices

```bash
node index.js devices list
node index.js devices get <id>
```

### Firewall

```bash
node index.js firewall zones
node index.js firewall policies
```

### Networks

```bash
node index.js networks list
```

All commands support `--json` for machine-readable output, e.g.:

```bash
node index.js clients stats --json | jq '.[] | {name, tx_bytes, rx_bytes}'
```

---

## clients stats output

Three tables per run:

| Table | Fields |
|-------|--------|
| **Traffic & Packets** | TX/RX bytes, TX/RX packets, TX retries, uptime — sorted by TX desc |
| **Wireless Signal & Rates** | SSID, band, channel, WiFi standard, signal dBm, noise, RSSI, TX/RX rate, satisfaction |
| **Device & Network Info** | Network, VLAN, IPv6, first/last seen, roam count, idle time |

---

## Device classification

`clients list` auto-categorizes devices by name pattern and MAC OUI:

| Category | Examples |
|----------|---------|
| Phone | iPhone, Pixel, Galaxy |
| Tablet | iPad |
| Computer | MacBook, MBP hostname, Intel OUI |
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

The tool uses two API layers:

- **Integration API** (`/proxy/network/integration/v1/`) — official, limited fields
- **Legacy controller API** (`/proxy/network/api/s/{site}/stat/sta`) — full stats including traffic, signal, and device fingerprinting

Both use the same API key with `X-API-Key` header over HTTPS (self-signed cert accepted).
