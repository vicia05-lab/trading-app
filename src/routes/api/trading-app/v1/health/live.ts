import { createFileRoute } from "@tanstack/react-router";
import { ensureBootstrapped } from "@/desk/bootstrap";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/trading-app/v1/health/live")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const boot = await ensureBootstrapped();
          const sql = await getSql();
          const [man, frz, pos, grd, adm, clk] = await Promise.all([
            sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM manifest`),
            sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM "freeze"`),
            sql.query<{ c: number; states: string }>(
              `SELECT COUNT(*)::int AS c, COALESCE(string_agg(state || ':' || display_ticker, ','), '') AS states FROM "position"`,
            ),
            sql.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM grade`),
            sql.query<{ c: number; outcomes: string }>(
              `SELECT COUNT(*)::int AS c, COALESCE(string_agg(outcome, ','), '') AS outcomes FROM execution_admission`,
            ),
            sql.query<{ now_utc: string }>(`SELECT now_utc::text FROM fixture_clock WHERE singleton_key = TRUE`),
          ]);
          return Response.json({
            product_name: "Trading App",
            paperOnly: true,
            liveTradingSupported: false,
            activeModelWeight: "0",
            data_mode: "FIXTURE",
            status: "live",
            bootstrap: boot.note,
            as_of: clk[0]?.now_utc ?? null,
            counts: {
              manifests: man[0]?.c ?? 0,
              freezes: frz[0]?.c ?? 0,
              positions: pos[0]?.c ?? 0,
              position_states: pos[0]?.states ?? "",
              grades: grd[0]?.c ?? 0,
              admissions: adm[0]?.c ?? 0,
              admission_outcomes: adm[0]?.outcomes ?? "",
            },
          });
        } catch (err) {
          console.error("[trading-app] bootstrap", err);
          const message = err instanceof Error ? err.message : String(err);
          return Response.json(
            {
              product_name: "Trading App",
              paperOnly: true,
              liveTradingSupported: false,
              activeModelWeight: "0",
              status: "error",
              error: message,
            },
            { status: 503 },
          );
        }
      },
    },
  },
});
