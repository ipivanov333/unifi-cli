// Device category classification based on name patterns and MAC OUI prefixes.

const NAME_RULES = [
  // Phones
  [/iphone|pixel|galaxy|android.*phone/i, 'Phone'],
  // Tablets
  [/ipad/i, 'Tablet'],
  // Laptops / desktops
  [/macbook|mac.*pro|mac.*mini|mac.*air|apple.*laptop|imac|windows.*pc|desktop/i, 'Computer'],
  // Smart TVs / displays
  [/lgwebostv|bravia|vizio|samsung.*tv|bathroom.?tv|tv\b/i, 'TV'],
  // Streaming / media
  [/nvidia.*shield|chromecast|roku|fire.*tv|apple.*tv|android.*tv/i, 'Media Player'],
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
  // Smart plugs / IoT
  [/wemo|kasa|tapo|shelly|tuya|espressif|esp8266|esp32/i, 'IoT / Smart Plug'],
  // Printers / scanners
  [/printer|scanner|hp.*officejet|epson|brother|canon/i, 'Printer'],
  // NAS / servers
  [/synology|qnap|nas\b|server|ubuntu|raspberry|pi\b/i, 'Server / NAS'],
];

export function classifyByName(name) {
  if (!name) return '?';
  for (const [pattern, category] of NAME_RULES) {
    if (pattern.test(name)) return category;
  }
  return '?';
}
