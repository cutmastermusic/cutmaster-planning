import type { NextConfig } from "next";
import os from "node:os";

/**
 * Next.js dev blocks `/_next/*` requests unless Origin's host is allowlisted (localhost + this list).
 * Without LAN IPs here, opening the app as http://10.x.x.x:3000 leaves the client stuck on the
 * loading shell because RSC/chunk fetches get 403. See `allowedDevOrigins` in Next.js docs.
 */
function discoverNonLocalIpv4Hosts(): string[] {
  const out = new Set<string>();
  try {
    const nets = os.networkInterfaces();
    for (const list of Object.values(nets)) {
      if (!list) continue;
      for (const net of list) {
        const isV4 = net.family === "IPv4" || String(net.family) === "4";
        if (!isV4 || net.internal) continue;
        if (net.address) out.add(net.address);
      }
    }
  } catch {
    /* ignore */
  }
  return [...out];
}

const extraAllowedDevOrigins = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const autoLanOrigins =
  process.env.NEXT_DEV_DISABLE_LAN_ORIGINS === "1" ? [] : discoverNonLocalIpv4Hosts();

const allowedDevOrigins = [...new Set([...autoLanOrigins, ...extraAllowedDevOrigins])];

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
