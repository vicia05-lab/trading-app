export default defineEventHandler(() => ({
  ok: true,
  service: "grok-github-trading-app",
  paperOnly: true,
  liveTradingSupported: false,
  timestamp: new Date().toISOString(),
}));
