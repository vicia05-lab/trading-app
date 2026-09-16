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
  .validator(z.object({ sessionDate: z.string().optional() }).optional())
  .handler(async ({ context, data }) => {
    const { fetchHomeImpl } = await import("./server-fns-impl.server");
    return fetchHomeImpl(context.userId, data?.sessionDate);
  });

export const fetchEarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { fetchEarningsImpl } = await import("./server-fns-impl.server");
    return fetchEarningsImpl(context.userId, data.sessionDate);
  });

export const fetchPredictions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ manifestId: z.string().optional(), sessionDate: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { fetchPredictionsImpl } = await import("./server-fns-impl.server");
    return fetchPredictionsImpl(context.userId, data.manifestId, data.sessionDate);
  });
