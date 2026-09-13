import { ensureBootstrapped } from "./bootstrap";
import { adminPayload, claimRole, earningsPayload, getOrCreatePrincipal, homePayload, noticesPayload, predictionsPayload, resultsPayload } from "./queries";
import { pauseAdmission, resumeAdmission, recordPrintKnowledge, appendFireRateNote, applyDueDeadlines } from "./lifecycle";
import { freezeMember } from "./commands";
import { DeskError, newId } from "./util";
import type { DeskRole } from "./util";
import {
  cancelOrder,
  closePosition,
  disconnect,
  getAccount,
  getClock,
  getOrders,
  getPositions,
  getSnapshots,
  getTickerDetail,
  publicStatus,
  saveCredentials,
  saveWatchlist,
  submitOrder,
} from "./alpaca";

export async function identityOf(userId: string): Promise<{ role: DeskRole; principal_id: string }> {
  const p = await getOrCreatePrincipal(userId, null);
  if (!p.role) throw new DeskError("FORBIDDEN", "Choose operator or reviewer first", 403);
  return { role: p.role, principal_id: p.principal_id };
}

async function roleOf(userId: string) {
  try {
    await ensureBootstrapped();
  } catch {
    /* earnings fixtures can fail independently of Alpaca keys */
  }
  const p = await getOrCreatePrincipal(userId, null);
  return { role: p.role, principal_id: p.principal_id };
}

function requireOperator(role: DeskRole | null): void {
  if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
}

export async function fetchMeImpl(userId: string) {
  const p = await getOrCreatePrincipal(userId, null);
  let alpaca = { connected: false, mode: null as "PAPER" | "LIVE" | null };
  try {
    const s = await publicStatus();
    alpaca = { connected: s.connected, mode: s.mode };
  } catch {
    /* keys UI still has to load */
  }
  return { userId, role: p.role, principal_id: p.principal_id, alpaca };
}

export async function claimRoleImpl(userId: string, role: "OPERATOR" | "REVIEWER") {
  return claimRole(userId, null, role);
}

export async function fetchHomeImpl(userId: string, sessionDate?: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return homePayload(role, sessionDate);
}

export async function fetchEarningsImpl(userId: string, sessionDate?: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return earningsPayload(role, sessionDate);
}

export async function fetchPredictionsImpl(userId: string, manifestId?: string, sessionDate?: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return predictionsPayload(role, manifestId, sessionDate);
}

export async function fetchResultsImpl(userId: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return resultsPayload(role);
}

export async function fetchAdminImpl(userId: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return adminPayload(role);
}

export async function fetchNoticesImpl(userId: string) {
  const { role } = await roleOf(userId);
  if (!role) return { needs_role: true as const };
  return noticesPayload(role);
}

export async function postPauseImpl(userId: string, reason: string) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return pauseAdmission(newId("cmd"), reason, principal_id);
}

export async function postResumeImpl(userId: string) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return resumeAdmission(newId("cmd"), principal_id);
}

export async function postPrintKnowledgeImpl(userId: string, data: { eventKey: string; securityId: string; reason: string }) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return recordPrintKnowledge(newId("cmd"), data, principal_id);
}

export async function postFireNoteImpl(userId: string, data: { hypothesis: "IMPLEMENTATION_BUG" | "COVERAGE_SHIFT" | "REGIME_SHIFT"; note: string }) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  return appendFireRateNote(newId("cmd"), { windowId: "win-2026q3", hypothesis: data.hypothesis, note: data.note }, principal_id);
}

export async function postRetryDeadlinesImpl(userId: string) {
  const { role } = await roleOf(userId);
  requireOperator(role);
  return applyDueDeadlines("svc-desk-writer");
}

export async function postVerifyFreezeImpl(userId: string, data: { manifestId: string; securityId: string }) {
  await roleOf(userId);
  return freezeMember(newId("cmd"), data.manifestId, data.securityId, "svc-desk-writer");
}

export async function fetchAlpacaStatusImpl(userId: string) {
  const { role } = await roleOf(userId);
  return { role, can_mutate: role === "OPERATOR", status: await publicStatus() };
}

export async function postAlpacaCredentialsImpl(
  userId: string,
  data: { apiKeyId: string; apiSecret: string; mode: "PAPER" | "LIVE"; confirmLive?: boolean },
) {
  const { role, principal_id } = await roleOf(userId);
  requireOperator(role);
  if (data.mode === "LIVE") {
    throw new Error("This workspace is paper-only. Live Alpaca trading is not available.");
  }
  try {
    const saved = await saveCredentials({ ...data, mode: "PAPER", actor: principal_id });
    try {
      const { execute } = await import("./alpaca-data-service.server");
      const current = await execute(userId, false, (s) => s.status(userId));
      const expectedVersion = current.ok ? current.status.version : null;
      await execute(userId, true, (s) =>
        s.save(userId, { apiKeyId: data.apiKeyId, apiSecret: data.apiSecret }, expectedVersion),
      );
    } catch {
      /* paper venue save is the source of truth for Trade */
    }
    return saved;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not store keys");
  }
}

export async function postAlpacaDisconnectImpl(userId: string) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return disconnect();
}

export async function postAlpacaWatchlistImpl(userId: string, watchlist: string[]) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return saveWatchlist(watchlist);
}

export async function fetchAlpacaDeskImpl(userId: string) {
  const { role } = await identityOf(userId);
  const status = await publicStatus();
  const can_mutate = role === "OPERATOR";
  if (!status.connected) {
    return { role, can_mutate, status, connected: false as const };
  }
  try {
    const [account, clock, positions, orders, quotes] = await Promise.all([
      getAccount(),
      getClock(),
      getPositions(),
      getOrders("open"),
      getSnapshots(status.watchlist),
    ]);
    return { role, can_mutate, status, connected: true as const, account, clock, positions, orders, quotes };
  } catch (e) {
    return {
      role,
      can_mutate,
      status,
      connected: true as const,
      error: e instanceof Error ? e.message : "Alpaca request failed",
    };
  }
}

export async function fetchAlpacaOrdersImpl(userId: string, status: "open" | "closed" | "all" = "all") {
  await identityOf(userId);
  return { orders: await getOrders(status) };
}

export async function postAlpacaOrderImpl(
  userId: string,
  data: {
    symbol: string;
    side: "buy" | "sell";
    type: "market" | "limit";
    timeInForce: "day" | "gtc" | "ioc";
    qty?: string;
    notional?: string;
    limitPrice?: string;
    extendedHours?: boolean;
    confirmLive?: boolean;
  },
) {
  const { role, principal_id } = await identityOf(userId);
  requireOperator(role);
  return submitOrder({ ...data, actor: principal_id });
}

export async function postAlpacaCancelImpl(userId: string, orderId: string) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return cancelOrder(orderId);
}

export async function postAlpacaCloseImpl(userId: string, symbol: string) {
  const { role } = await identityOf(userId);
  requireOperator(role);
  return closePosition(symbol);
}

export async function runAutoCycleImpl(userId: string) {
  await identityOf(userId);
  const { runAutoCycle } = await import("./auto-trade");
  return runAutoCycle(userId);
}

export async function fetchAutoStatusImpl(userId: string) {
  await identityOf(userId);
  const { autoStatus } = await import("./auto-trade");
  return autoStatus();
}

export async function fetchTickerDetailImpl(userId: string, symbol: string) {
  await identityOf(userId);
  return getTickerDetail(symbol, userId);
}
