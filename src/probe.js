import net from 'net';

export function tcpProbe(ip, port, timeout = 1500) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.once('error', () => resolve(false));
    sock.connect(port, ip);
  });
}

export async function probeIphone(ip) {
  return tcpProbe(ip, 62078);
}
