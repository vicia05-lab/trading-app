import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const runIntradaySyntheticExample = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z
      .object({
        strategyId: z.enum(["ORB5_RVOL_LONG", "SPY_NOISE_VWAP_LONG", "SPY_LATE_MOM_LONG"]),
        scenario: z.enum(["qualifying", "no_setup", "missing_data"]),
      })
      .strict(),
  )
  .handler(async ({ context, data }) => {
    const { runIntradayExample } = await import("./intraday-research.server");
    return runIntradayExample(context.userId, data);
  });
