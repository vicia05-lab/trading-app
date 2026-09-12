import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

/** Server-only desk code is loaded inside handlers so the browser never sees node:crypto. */

export const fetchMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchMeImpl } = await import("./server-fns-impl.server");
    return fetchMeImpl(context.userId);
  });

export const postClaimRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ role: z.enum(["OPERATOR", "REVIEWER"]) }))
  .handler(async ({ context, data }) => {
    const { claimRoleImpl } = await import("./server-fns-impl.server");
    return claimRoleImpl(context.userId, data.role);
  });

export const fetchHome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchHomeImpl } = await import("./server-fns-impl.server");
    return fetchHomeImpl(context.userId);
  });

export const fetchEarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { fetchEarningsImpl } = await import("./server-fns-impl.server");
    return fetchEarningsImpl(context.userId, data.sessionDate);
  });

export const fetchPredictions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string().optional(), sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { fetchPredictionsImpl } = await import("./server-fns-impl.server");
    return fetchPredictionsImpl(context.userId, data.manifestId, data.sessionDate);
  });

export const fetchResults = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchResultsImpl } = await import("./server-fns-impl.server");
    return fetchResultsImpl(context.userId);
  });

export const fetchAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAdminImpl } = await import("./server-fns-impl.server");
    return fetchAdminImpl(context.userId);
  });

export const postPause = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reason: z.string().min(1).max(500) }))
  .handler(async ({ context, data }) => {
    const { postPauseImpl } = await import("./server-fns-impl.server");
    return postPauseImpl(context.userId, data.reason);
  });

export const postResume = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { postResumeImpl } = await import("./server-fns-impl.server");
    return postResumeImpl(context.userId);
  });

export const postPrintKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ eventKey: z.string(), securityId: z.string(), reason: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const { postPrintKnowledgeImpl } = await import("./server-fns-impl.server");
    return postPrintKnowledgeImpl(context.userId, data);
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
    const { postFireNoteImpl } = await import("./server-fns-impl.server");
    return postFireNoteImpl(context.userId, data);
  });

export const postRetryDeadlines = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { postRetryDeadlinesImpl } = await import("./server-fns-impl.server");
    return postRetryDeadlinesImpl(context.userId);
  });

export const postVerifyFreeze = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string(), securityId: z.string() }))
  .handler(async ({ context, data }) => {
    const { postVerifyFreezeImpl } = await import("./server-fns-impl.server");
    return postVerifyFreezeImpl(context.userId, data);
  });

export const fetchAlpacaStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAlpacaStatusImpl } = await import("./server-fns-impl.server");
    return fetchAlpacaStatusImpl(context.userId);
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
    const { postAlpacaCredentialsImpl } = await import("./server-fns-impl.server");
    return postAlpacaCredentialsImpl(context.userId, data);
  });

export const postAlpacaDisconnect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { postAlpacaDisconnectImpl } = await import("./server-fns-impl.server");
    return postAlpacaDisconnectImpl(context.userId);
  });

export const postAlpacaWatchlist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ watchlist: z.array(z.string()).min(1).max(24) }))
  .handler(async ({ context, data }) => {
    const { postAlpacaWatchlistImpl } = await import("./server-fns-impl.server");
    return postAlpacaWatchlistImpl(context.userId, data.watchlist);
  });

export const fetchAlpacaDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { fetchAlpacaDeskImpl } = await import("./server-fns-impl.server");
    return fetchAlpacaDeskImpl(context.userId);
  });

export const fetchAlpacaOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.enum(["open", "closed", "all"]).optional() }))
  .handler(async ({ context, data }) => {
    const { fetchAlpacaOrdersImpl } = await import("./server-fns-impl.server");
    return fetchAlpacaOrdersImpl(context.userId, data.status);
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
    const { postAlpacaOrderImpl } = await import("./server-fns-impl.server");
    return postAlpacaOrderImpl(context.userId, data);
  });

export const postAlpacaCancel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    const { postAlpacaCancelImpl } = await import("./server-fns-impl.server");
    return postAlpacaCancelImpl(context.userId, data.orderId);
  });

export const postAlpacaClose = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ symbol: z.string().min(1).max(10) }))
  .handler(async ({ context, data }) => {
    const { postAlpacaCloseImpl } = await import("./server-fns-impl.server");
    return postAlpacaCloseImpl(context.userId, data.symbol);
  });
