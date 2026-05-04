// Device category classification based on name patterns and MAC OUI prefixes.

const NAME_RULES = [
  // Phones
  [/apple iphone|iphone|pixel|galaxy|android.*phone/i, 'Phone'],
  // Tablets
  [/apple ipad|ipad/i, 'Tablet'],
  // Laptops / desktops
  [/macbook|mac.*pro|mac.*mini|mac.*air|apple.*laptop|imac|windows.*pc|desktop|\bMBP\b/i, 'Computer'],
  // Streaming / media — before TV so "Shield TV" / "Fire TV" don't match tv\b
  [/nvidia.*shield|chromecast|roku|fire.*tv|apple.*tv|android.*tv/i, 'Media Player'],
  // Smart TVs / displays
  [/lgwebostv|bravia|vizio|samsung.*tv|bathroom.?tv|tv\b/i, 'TV'],
  // Gaming
  [/xbox|playstation|nintendo|steam.*deck/i, 'Gaming'],
  // Smart speakers / hubs
  [/amazon\b|echo\b|alexa|google.*home|homepod/i, 'Smart Speaker'],
  // Security cameras / doorbells
  [/ring|arlo|nest.*cam|eufy|blink|reolink|doorbell/i, 'Security Camera'],
  // Thermostats / HVAC
  [/nest.*thermo|ecobee|honeywell|thermostat/i, 'Thermostat'],
  // Appliances
  [/dishwasher|washer|dryer|refrigerator|bosch|miele|lg.*appliance/i, 'Appliance'],
  // Robot vacuums
  [/shark|roomba|roborock|irobot|vacuum/i, 'Robot Vacuum'],
  // Network infrastructure
  [/pihole|pi.hole|unifi|switch|router|access.*point|ripe.*probe|mikrotik/i, 'Network'],
  // EV chargers
  [/\bcs_[0-9a-f]+|chargepoint|juicebox|wallbox/i, 'EV Charger'],
  // Irrigation controllers
  [/rainbird|rachio|orbit.*bhyve|bhyve/i, 'Irrigation'],
  // Smart plugs / IoT
  [/wemo|kasa|tapo|shelly|tuya|espressif|esp8266|esp32/i, 'IoT / Smart Plug'],
  // Printers — HP network printers use NPI prefix, plus generic terms
  [/\bNPI\d+|printer|scanner|hp.*officejet|epson|brother|canon/i, 'Printer'],
  // NAS / servers
  [/synology|qnap|nas\b|server|ubuntu|raspberry|pi\b/i, 'Server / NAS'],
];

// OUI (first 3 octets of MAC) → device category fallback.
// Used when name-based rules return '?'.
const OUI_RULES = [
  // Apple
  [/^(00:03:93|00:05:02|00:0a:27|00:0a:95|00:11:24|00:14:51|00:16:cb|00:17:f2|00:19:e3|00:1b:63|00:1c:b3|00:1d:4f|00:1e:52|00:1e:c2|00:1f:5b|00:1f:f3|00:21:e9|00:22:41|00:23:12|00:23:32|00:23:df|00:24:36|00:25:00|00:25:4b|00:25:bc|00:26:08|00:26:4a|00:26:b0|00:26:bb|00:30:65|00:3e:e1|00:50:e4|00:56:cd|00:61:71|00:6d:52|04:0c:ce|04:15:52|04:26:65|04:4b:ed|04:54:53|04:69:f8|04:f7:e4|08:00:07|08:6d:41|08:70:45|08:74:02|0c:3e:9f|0c:4d:e9|0c:51:01|0c:74:c2|0c:77:1a|0c:bc:9f|0c:d7:46|10:1c:0c|10:40:f3|10:93:e9|10:9a:dd|10:dd:b1|14:10:9f|14:5a:05|14:8f:c6|14:99:e2|18:20:32|18:65:90|18:81:0e|18:9e:fc|18:af:61|1c:1a:c0|1c:36:bb|20:78:f0|20:a2:e4|20:ab:37|20:c9:d0|24:1e:eb|24:a0:74|28:37:37|28:6a:ba|28:a0:2b|28:cf:da|28:cf:e9|28:e0:2c|2c:1f:23|2c:20:0b|2c:b4:3a|2c:f0:a2|30:10:e4|30:35:ad|34:08:bc|34:15:9e|34:36:3b|34:51:c9|34:a3:95|34:ab:37|38:0f:4a|38:48:4c|38:71:de|38:c9:86|38:f9:d3|3c:07:54|3c:15:c2|3c:2e:f9|40:3c:fc|40:4d:7f|40:6c:8f|40:83:1d|40:9c:28|40:a6:d9|40:b3:95|44:2a:60|44:d8:84|44:fb:42|48:43:7c|48:60:bc|48:74:6e|48:a9:1c|4c:32:75|4c:57:ca|4c:74:03|4c:8d:79|4c:b1:99|50:32:37|50:82:d5|54:26:96|54:33:cb|54:4e:90|54:72:4f|54:99:63|54:ae:27|54:e4:3a|58:1f:aa|58:40:4e|58:55:ca|58:6d:8f|58:7f:57|5c:59:48|5c:8d:4e|5c:96:9d|5c:f9:38|60:03:08|60:33:4b|60:69:44|60:8c:4a|60:9a:c1|60:c5:47|60:d9:c7|60:f4:45|60:f8:1d|64:20:0c|64:76:ba|64:a3:cb|64:b9:e8|68:09:27|68:5b:35|68:64:4b|68:9c:70|68:a8:6d|6c:19:c0|6c:40:08|6c:4d:73|6c:72:e7|6c:8d:c1|6c:94:f8|70:11:24|70:14:a6|70:3e:ac|70:56:81|70:73:cb|70:cd:60|70:de:e2|74:81:14|74:e1:b6|74:e2:f5|78:31:c1|78:32:1b|78:4f:43|78:67:d7|78:6c:1c|78:7e:61|78:9f:70|7c:01:91|7c:04:d0|7c:11:be|7c:5c:f8|7c:6d:62|7c:c3:a1|7c:d1:c3|7c:f0:22|80:00:6e|80:19:34|80:49:71|80:92:9f|80:be:05|80:e6:50|84:29:99|84:38:35|84:78:8b|84:85:06|84:89:ad|84:8e:0c|84:a1:34|84:b1:53|84:fc:fe|88:19:08|88:1f:a1|88:53:2e|88:63:df|88:e8:7f|8c:2d:aa|8c:4b:14|8c:7c:92|8c:85:90|8c:8e:f2|90:27:e4|90:3c:92|90:60:f0|90:72:40|90:8d:6c|90:c1:c6|94:94:26|94:bf:2d|94:e9:6a|94:f6:a3|98:00:c6|98:01:a7|98:03:d8|98:10:e8|98:1c:a0|98:46:0a|98:5a:eb|98:ca:33|98:d6:bb|98:fe:94|9c:04:eb|9c:20:7b|9c:35:eb|9c:4f:da|9c:84:bf|9c:e3:3f|a0:11:6b|a0:3b:e3|a0:4e:a7|a0:99:9b|a0:d7:95|a4:5e:60|a4:67:06|a4:b1:97|a4:c3:61|a4:d1:8c|a4:d9:31|a8:20:66|a8:51:ab|a8:5b:78|a8:66:7f|a8:86:dd|a8:8e:24|a8:96:8a|a8:fa:d8|ac:1f:74|ac:3c:0b|ac:61:ea|ac:7f:3e|ac:87:a3|ac:bc:32|ac:cf:85|ac:de:48|b0:34:95|b0:65:bd|b0:70:2d|b4:4b:d2|b4:f0:ab|b8:09:8a|b8:17:c2|b8:44:d9|b8:53:ac|b8:5d:0a|b8:78:2e|b8:c7:5d|bc:3b:af|bc:52:b7|bc:67:78|bc:92:6b|c0:63:94|c0:84:7a|c0:9f:42|c0:cc:f8|c0:d0:12|c4:2c:03|c4:b3:01|c8:2a:14|c8:33:4b|c8:3c:85|c8:69:cd|c8:6f:1d|c8:85:50|c8:bc:c8|c8:f6:50|cc:08:8d|cc:20:e8|cc:29:f5|cc:44:63|d0:03:4b|d0:23:db|d0:25:98|d0:4f:7e|d0:65:ca|d0:81:7a|d0:a6:37|d4:61:9d|d4:90:9c|d4:f4:6f|d8:1d:72|d8:30:62|d8:96:95|d8:bb:2c|dc:0c:5c|dc:37:14|dc:41:5f|dc:86:d8|dc:9b:9c|e0:33:8e|e0:5f:45|e0:ac:cb|e0:b5:2d|e0:b9:ba|e0:c7:67|e0:f5:c6|e4:25:e7|e4:8b:7f|e4:9a:dc|e4:c6:3d|e4:ce:8f|e8:04:0b|e8:06:88|e8:80:2e|e8:8d:28|ec:35:86|ec:85:2f|f0:18:98|f0:24:75|f0:79:60|f0:b4:79|f0:c1:f1|f0:d1:a9|f0:db:f8|f0:dc:e2|f4:1b:a1|f4:31:c3|f4:37:b7|f4:5c:89|f4:d4:88|f4:f1:5a|f4:f9:51|f8:27:93|f8:2f:a8|f8:a9:d0|f8:ff:c2|fc:25:3f|fc:e9:98)/, 'Computer'],
  // Intel NICs (common in Windows PCs and laptops)
  [/^(00:02:b3|00:03:47|00:04:23|00:0e:0c|00:11:11|00:12:f0|00:13:20|00:13:ce|00:15:17|00:16:76|00:18:de|00:19:d1|00:1b:21|00:1c:bf|00:1d:e0|00:1e:67|00:1e:64|00:1f:3b|00:21:6a|00:22:fb|00:23:14|00:24:d7|00:27:10|28:d2:44|4c:79:6e|54:27:1e|68:05:ca|70:77:81|7c:7a:91|8c:ec:4b|98:4f:ee|a0:88:b4|a4:c3:f0|b0:09:da|d0:50:99|d4:be:d9|e8:11:32|f8:16:54)/, 'Computer'],
  // Samsung (phones, tablets, TVs, laptops)
  [/^(00:12:47|00:15:99|00:16:32|00:17:c9|00:21:19|00:23:39|00:24:54|00:26:37|04:18:0f|08:08:c2|08:d4:2b|10:d5:42|14:49:e0|18:3d:a2|20:d3:90|24:4b:03|28:39:5e|34:31:11|40:0e:85|40:9b:cd|44:4e:1a|50:01:bb|50:32:75|58:ef:68|60:a1:0a|6c:2f:2c|70:f9:27|78:40:e4|84:25:3f|88:32:9b|8c:77:12|94:35:0a|94:51:03|98:52:b1|a0:0b:ba|a4:47:4a|a8:9a:93|ac:ee:9e|b4:3a:28|b4:ef:fa|bc:20:a4|c0:bd:d1|c4:50:06|cc:07:ab|d0:17:6a|d0:22:be|d4:00:0b|d8:57:ef|e8:50:8b|f0:25:b7|f4:42:8f|f8:04:2e|fc:00:12|fc:a1:3e)/, 'Phone / TV'],
];

export function classifyByName(name) {
  if (!name) return '?';
  for (const [pattern, category] of NAME_RULES) {
    if (pattern.test(name)) return category;
  }
  return '?';
}

export function classifyByOui(mac) {
  if (!mac) return '?';
  const prefix = mac.toLowerCase().slice(0, 8); // first 3 octets
  for (const [pattern, category] of OUI_RULES) {
    if (pattern.test(prefix)) return category;
  }
  return '?';
}

export function classify(name, mac) {
  const byName = classifyByName(name);
  if (byName !== '?') return byName;
  return classifyByOui(mac);
}
