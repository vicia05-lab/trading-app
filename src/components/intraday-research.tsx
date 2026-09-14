import { useState } from "react";
import { INTRADAY_STRATEGIES, EXPERIMENTAL_IDEAS } from "@/desk/intraday-catalog";
import type { IntradayStrategyId } from "@/desk/intraday-catalog";
import { runIntradaySyntheticExample } from "@/desk/intraday-research-fns";
import type { IntradayResult } from "@/kernel/intraday";

export type IntradayExampleRunner = (data: {
  strategyId: IntradayStrategyId;
  scenario: "qualifying" | "no_setup" | "missing_data";
}) => Promise<{ evidenceScope: "SYNTHETIC_EXAMPLE"; notice: string; result: IntradayResult }>;
const defaultRun: IntradayExampleRunner = (data) => runIntradaySyntheticExample({ data });
const statusNames: Record<IntradayResult["status"], string> = {
  LONG_SETUP: "Long research setup",
  NO_SETUP: "No qualifying setup",
  WAIT: "Waiting for the strategy window",
  BLOCKED: "Required evidence unavailable",
  INVALID_INPUT: "Invalid research inputs",
};
const reasons: Record<string, string> = {
  OPENING_RANGE_BREAKOUT:
    "The completed price bar crossed the opening high after the activity filters passed.",
  ABOVE_NOISE_BAND_AND_VWAP:
    "Price is above the time-of-day boundary and volume-weighted session price.",
  POSITIVE_MORNING_RETURN:
    "The prior-close-to-10:00 return is positive at the late-session checkpoint.",
  NO_NEW_CLOSED_BAR_BREAKOUT:
    "The example did not produce a new confirmed break above the opening high.",
  WITHIN_NOISE_OR_BELOW_VWAP: "Price is still in the noise range or below VWAP.",
  MORNING_RETURN_NOT_POSITIVE:
    "The first-half-hour return from the previous close is not positive.",
  READINESS_NOT_VERIFIED: "The source has not been verified. Missing evidence does not mean ready.",
};

/** UI consumes server results only. Injected runner is reserved for isolated browser tests. */
export function IntradayResearch({
  runExample = defaultRun,
}: {
  runExample?: IntradayExampleRunner;
}) {
  const [selected, setSelected] = useState<IntradayStrategyId>("ORB5_RVOL_LONG");
  const [scenario, setScenario] = useState<"qualifying" | "no_setup" | "missing_data">(
    "qualifying",
  );
  const [response, setResponse] = useState<Awaited<ReturnType<IntradayExampleRunner>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strategy = INTRADAY_STRATEGIES.find((s) => s.id === selected)!;
  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResponse(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("EXAMPLE_TIMEOUT")), 12000);
      });
      setResponse(await Promise.race([runExample({ strategyId: selected, scenario }), timeout]));
    } catch {
      setError(
        "The example could not run. No position was created. Retry when the service is available.",
      );
    } finally {
      if (timer) clearTimeout(timer);
      setBusy(false);
    }
  }
  function choose(id: IntradayStrategyId) {
    setSelected(id);
    setResponse(null);
    setError(null);
  }
  return (
    <section className="flex flex-col gap-6" aria-labelledby="intraday-title">
      <header>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Research extension · paper only · not activated
        </p>
        <h1 id="intraday-title" className="text-2xl font-semibold tracking-tight">
          Day trading research
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Three evidence-backed ideas, with explicit rules and limitations. Published backtests are
          not proof of future profits. Earnings decisions and capital limits are unchanged.
        </p>
      </header>
      <div
        className="rounded-lg border border-border bg-subtle p-4 text-sm leading-relaxed"
        role="note"
      >
        <strong>Research, not orders.</strong> This module can run synthetic signal examples.
        Historical replay, prospective capture, shared-risk admission and scheduled exits are not
        connected yet. No market results or positions are invented.
      </div>
      <div className="grid gap-3 md:grid-cols-3" aria-label="Research strategy selection">
        {INTRADAY_STRATEGIES.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={busy}
            aria-pressed={selected === s.id}
            onClick={() => choose(s.id)}
            className={`min-h-36 rounded-lg border p-4 text-left transition-colors disabled:opacity-50 ${selected === s.id ? "border-info bg-selected" : "border-border bg-surface hover:bg-subtle"}`}
          >
            <span className="block text-xs font-medium text-muted">{s.priority}</span>
            <span className="mt-2 block text-base font-semibold">{s.name}</span>
            <span className="mt-1 block text-sm text-muted">{s.subtitle}</span>
            <span className="mt-3 block text-xs text-info">{s.evidence}</span>
          </button>
        ))}
      </div>
      <article className="rounded-lg border border-border bg-surface p-4 md:p-6">
        <h2 className="text-lg font-semibold">{strategy.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{strategy.evidenceSummary}</p>
        <a
          className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-info underline underline-offset-4"
          href={strategy.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the original study <span className="sr-only">(opens a new tab)</span>
        </a>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          {strategy.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
        <dl className="mt-5 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium">What differs from the study</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{strategy.differences}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Where it can fail</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{strategy.failureMode}</dd>
          </div>
        </dl>
      </article>
      <section
        className="rounded-lg border border-border bg-surface p-4 md:p-6"
        aria-labelledby="intraday-example-title"
      >
        <h2 id="intraday-example-title" className="text-lg font-semibold">
          Try the rule on a fictional example
        </h2>
        <p className="mt-1 text-sm text-muted">
          The TypeScript server evaluates closed bars. These are not live quotes, historical
          returns, or evidence of an edge.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-1 text-sm">
            <label htmlFor="intraday-scenario">Scenario</label>
            <select
              id="intraday-scenario"
              value={scenario}
              disabled={busy}
              onChange={(e) => {
                setScenario(e.target.value as typeof scenario);
                setResponse(null);
              }}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
            >
              <option value="qualifying">Qualifying inputs</option>
              <option value="no_setup">No qualifying setup</option>
              <option value="missing_data">Missing source verification</option>
            </select>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run()}
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50"
          >
            {busy ? "Running example…" : "Run synthetic example"}
          </button>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {response ? (
          <div className="mt-5 rounded-md border border-border bg-subtle p-4" role="status">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Synthetic example · no order · no capital reserved
            </p>
            <p className="mt-2 font-semibold">{statusNames[response.result.status]}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {reasons[response.result.reasons[0]] ??
                "Inspect the recorded reason in the technical details."}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Fictional reference price</dt>
                <dd className="break-all font-mono">
                  {response.result.referencePrice ?? "Not available"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Reference invalidation, not a stop order</dt>
                <dd className="break-all font-mono">
                  {response.result.invalidationPrice ??
                    "Time-based hypothesis; no price stop defined"}
                </dd>
              </div>
            </dl>
            <details className="mt-4 text-sm">
              <summary className="min-h-11 cursor-pointer font-medium">
                Computed references and evidence digest
              </summary>
              <dl className="grid gap-2">
                {Object.entries(response.result.metrics).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted">{k}</dt>
                    <dd className="break-all font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 break-all font-mono text-xs">{response.result.inputHash}</p>
              <p className="mt-2 break-all text-xs">{response.result.reasons.join(", ")}</p>
              <p className="mt-2 text-xs text-muted">
                Digest identifies the supplied synthetic frame; it is not a provider-authenticity
                attestation.
              </p>
            </details>
          </div>
        ) : null}
      </section>
      <section
        className="rounded-lg border border-border p-4 text-sm"
        aria-label="Activation requirements"
      >
        <h2 className="font-semibold">Before automated paper positions</h2>
        <p className="mt-2 leading-relaxed text-muted">
          Verify consolidated data and historical timestamps, run independent cost-aware replay,
          record prospective signals, and test the shared reservation and exit controls. Missing
          exit evidence must remain unresolved—not falsely flat. Activation requires a separate
          reviewed change.
        </p>
        <p className="mt-2 leading-relaxed text-muted">
          All three candidates lean toward momentum. Agreement is not three independent votes. Do
          not combine their apparent profits or tune thresholds after a few wins or losses.
        </p>
      </section>
      <details className="rounded-lg border border-border p-4 text-sm">
        <summary className="min-h-11 cursor-pointer font-medium">
          Patterns kept experimental
        </summary>
        {EXPERIMENTAL_IDEAS.map((x) => (
          <p className="mt-2 leading-relaxed text-muted" key={x}>
            {x}
          </p>
        ))}
      </details>
    </section>
  );
}
