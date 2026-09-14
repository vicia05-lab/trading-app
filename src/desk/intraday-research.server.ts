import { getOrCreatePrincipal } from "./queries";
import { evaluateIntraday } from "../kernel/intraday.ts";
import { intradayFixture } from "./intraday-fixtures.ts";
import type { IntradayStrategyId } from "./intraday-catalog.ts";

/** Synthetic examples are read-only and reveal no historical outcome or user account data. */
export async function runIntradayExample(
  userId: string,
  data: {
    strategyId: IntradayStrategyId;
    scenario: "qualifying" | "no_setup" | "missing_data";
  },
) {
  const principal = await getOrCreatePrincipal(userId, null);
  if (principal.role !== "OPERATOR" && principal.role !== "REVIEWER") throw new Error("FORBIDDEN");
  const frame = intradayFixture(data.strategyId);
  if (data.scenario === "missing_data") frame.sourceState = "NOT_CHECKED";
  if (data.scenario === "no_setup") {
    if (data.strategyId === "SPY_LATE_MOM_LONG") frame.bars[29].close = "99.950000";
    else frame.bars.at(-1)!.close = "100.300000";
  }
  return {
    evidenceScope: "SYNTHETIC_EXAMPLE" as const,
    notice: "Fictional prices. A software example, not a backtest or a trade recommendation.",
    result: evaluateIntraday(frame),
  };
}
