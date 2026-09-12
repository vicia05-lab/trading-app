import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
export type { SecretReply } from "./alpaca-data-service.server";

// Sensitive implementation is imported only inside extracted server handlers.
export const fetchAlpacaDataSecret = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { execute } = await import("./alpaca-data-service.server");
    return execute(context.userId, false, (s) => s.status(context.userId));
  });

export const saveAlpacaDataSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    apiKeyId: z.string().min(8).max(80),
    apiSecret: z.string().min(8).max(256),
    expectedVersion: z.string().uuid().nullable(),
  }).strict())
  .handler(async ({ context, data }) => {
    const { execute } = await import("./alpaca-data-service.server");
    const reply = await execute(context.userId, true, (s) => s.save(
      context.userId, { apiKeyId: data.apiKeyId, apiSecret: data.apiSecret }, data.expectedVersion,
    ));
    if (reply.ok) {
      try {
        const { saveCredentials } = await import("./alpaca");
        await saveCredentials({
          apiKeyId: data.apiKeyId,
          apiSecret: data.apiSecret,
          mode: "PAPER",
          actor: context.userId,
        });
      } catch {
        /* market-data secret is saved even if the paper venue probe fails */
      }
    }
    return reply;
  });

export const testAlpacaDataSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ expectedVersion: z.string().uuid() }).strict())
  .handler(async ({ context, data }) => {
    const { execute } = await import("./alpaca-data-service.server");
    return execute(context.userId, true, (s) => s.test(context.userId, data.expectedVersion));
  });

export const removeAlpacaDataSecret = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ expectedVersion: z.string().uuid() }).strict())
  .handler(async ({ context, data }) => {
    const { execute } = await import("./alpaca-data-service.server");
    return execute(context.userId, true, (s) => s.remove(context.userId, data.expectedVersion));
  });
