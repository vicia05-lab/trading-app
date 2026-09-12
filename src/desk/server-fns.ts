import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { ensureBootstrapped } from "./bootstrap";
import { adminPayload, claimRole, earningsPayload, getOrCreatePrincipal, homePayload, predictionsPayload, resultsPayload } from "./queries";
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
  publicStatus,
  saveCredentials,
  saveWatchlist,
  submitOrder,
} from "./alpaca";

async function identityOf(userId: string): Promise<{ role: DeskRole; principal_id: string }> {
  let p = await getOrCreatePrincipal(userId, null);
  if (!p.role) {
    await claimRole(userId, null, "OPERATOR");
    p = await getOrCreatePrincipal(userId, null);
  }
  if (!p.role) throw new DeskError("FORBIDDEN", "Could not assign operator", 403);
  return { role: p.role, principal_id: p.principal_id };
}

async function roleOf(userId: string): Promise<{ role: DeskRole | null; principal_id: string }> {
  try {
    await ensureBootstrapped();
  } catch {
    /* earnings fixtures can fail independently of Alpaca keys */
  }
  const p = await identityOf(userId);
  return p;
}

function requireOperator(role: DeskRole | null): void {
  if (role !== "OPERATOR") throw new DeskError("FORBIDDEN", "OPERATOR only", 403);
}

function requireRole(role: DeskRole | null): asserts role is DeskRole {
  if (!role) throw new DeskError("FORBIDDEN", "Assign a desk role first", 403);
}

export const fetchMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const p = await identityOf(context.userId);
    let alpaca = { connected: false, mode: null as "PAPER" | "LIVE" | null };
    try {
      const s = await publicStatus();
      alpaca = { connected: s.connected, mode: s.mode };
    } catch {
      /* keys UI still has to load */
    }
    return {
      userId: context.userId,
      role: p.role,
      principal_id: p.principal_id,
      alpaca,
    };
  });

export const postClaimRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ role: z.enum(["OPERATOR", "REVIEWER"]) }))
  .handler(async ({ context, data }) => {
    return claimRole(context.userId, null, data.role);
  });

export const fetchHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return homePayload(role);
  });

export const fetchEarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return earningsPayload(role, data.sessionDate);
  });

export const fetchPredictions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string().optional(), sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return predictionsPayload(role, data.manifestId, data.sessionDate);
  });

export const fetchResults = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return resultsPayload(role);
  });

export const fetchAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    if (!role) return { needs_role: true as const };
    return adminPayload(role);
  });

export const postPause = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reason: z.string().min(1).max(500) }))
  .handler(async ({ context, data }) => {
    const { role, principal_id } = await roleOf(context.userId);
    requireOperator(role);
    return pauseAdmission(newId("cmd"), data.reason, principal_id);
  });

export const postResume = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role, principal_id } = await roleOf(context.userId);
    requireOperator(role);
    return resumeAdmission(newId("cmd"), principal_id);
  });

export const postPrintKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ eventKey: z.string(), securityId: z.string(), reason: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const { role, principal_id } = await roleOf(context.userId);
    requireOperator(role);
    return recordPrintKnowledge(newId("cmd"), data, principal_id);
  });

export const postFireNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      hypothesis: z.enum(["IMPLEMENTATION_BUG", "COVERAGE_SHIFT", "REGIME_SHIFT"]),
      note: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ context, data }) => {
    const { role, principal_id } = await roleOf(context.userId);
    requireOperator(role);
    return appendFireRateNote(newId("cmd"), { windowId: "win-2026q3", hypothesis: data.hypothesis, note: data.note }, principal_id);
  });

export const postRetryDeadlines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await roleOf(context.userId);
    requireOperator(role);
    return applyDueDeadlines("svc-desk-writer");
  });

export const postVerifyFreeze = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string(), securityId: z.string() }))
  .handler(async ({ context, data }) => {
    await roleOf(context.userId);
    return freezeMember(newId("cmd"), data.manifestId, data.securityId, "svc-desk-writer");
  });

export const fetchAlpacaStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await identityOf(context.userId);
    return { role, can_mutate: role === "OPERATOR", status: await publicStatus() };
  });

export const postAlpacaCredentials = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      apiKeyId: z.string().min(8).max(80),
      apiSecret: z.string().min(8).max(256),
      mode: z.enum(["PAPER", "LIVE"]),
      confirmLive: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const { role, principal_id } = await identityOf(context.userId);
      requireOperator(role);
      return await saveCredentials({ ...data, actor: principal_id });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Could not store keys");
    }
  });

export const postAlpacaDisconnect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await identityOf(context.userId);
    requireOperator(role);
    return disconnect();
  });

export const postAlpacaWatchlist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ watchlist: z.array(z.string()).min(1).max(24) }))
  .handler(async ({ context, data }) => {
    const { role } = await identityOf(context.userId);
    requireOperator(role);
    return saveWatchlist(data.watchlist);
  });

export const fetchAlpacaDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { role } = await identityOf(context.userId);
    const status = await publicStatus();
    if (!status.connected) {
      return { role, can_mutate: role === "OPERATOR", status, connected: false as const };
    }
    try {
      const [account, clock, positions, orders, quotes] = await Promise.all([
        getAccount(),
        getClock(),
        getPositions(),
        getOrders("open"),
        getSnapshots(status.watchlist),
      ]);
      return {
        role,
        can_mutate: role === "OPERATOR",
        status,
        connected: true as const,
        account,
        clock,
        positions,
        orders,
        quotes,
      };
    } catch (e) {
      return {
        role,
        can_mutate: role === "OPERATOR",
        status,
        connected: true as const,
        error: e instanceof Error ? e.message : "Alpaca request failed",
      };
    }
  });

export const fetchAlpacaOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.enum(["open", "closed", "all"]).optional() }))
  .handler(async ({ context, data }) => {
    const { role } = await identityOf(context.userId);
    return { orders: await getOrders(data.status ?? "all") };
  });

export const postAlpacaOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      symbol: z.string().min(1).max(10),
      side: z.enum(["buy", "sell"]),
      type: z.enum(["market", "limit"]),
      timeInForce: z.enum(["day", "gtc", "ioc"]),
      qty: z.string().optional(),
      notional: z.string().optional(),
      limitPrice: z.string().optional(),
      extendedHours: z.boolean().optional(),
      confirmLive: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { role, principal_id } = await identityOf(context.userId);
    requireOperator(role);
    return submitOrder({ ...data, actor: principal_id });
  });

export const postAlpacaCancel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    const { role } = await identityOf(context.userId);
    requireOperator(role);
    return cancelOrder(data.orderId);
  });

export const postAlpacaClose = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ symbol: z.string().min(1).max(10) }))
  .handler(async ({ context, data }) => {
    const { role } = await identityOf(context.userId);
    requireOperator(role);
    return closePosition(data.symbol);
  });
