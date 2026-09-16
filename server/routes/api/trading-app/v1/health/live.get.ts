import { defineHandler } from "nitro";

export default defineHandler(() => ({
  ok: true,
  service: "grok-github-trading-app",
  paperOnly: true,
  liveTradingSupported: false,
  timestamp: new Date().toISOString(),
}));
