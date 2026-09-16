import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
export const runVolumeSyntheticExample = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z
      .object({
        scenario: z.enum([
          "qualifying",
          "capacity_full",
          "missing_data",
          "low_liquidity",
          "same_bar_entry",
          "missing_exit",
        ]),
      })
      .strict(),
  )
  .handler(async ({ context, data }) => {
    const { runVolumeExample } = await import("./volume-research.server");
    return runVolumeExample(context.userId, data.scenario);
  });
