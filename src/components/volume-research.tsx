import { useState } from "react";
import { runVolumeSyntheticExample } from "@/desk/volume-research-fns";
import type { VolumeCapture } from "@/desk/volume-capture";
import type { VolumeExit } from "@/kernel/volume-replay";
type Scenario =
  | "qualifying"
  | "capacity_full"
  | "missing_data"
  | "low_liquidity"
  | "same_bar_entry"
  | "missing_exit";
export type VolumeExampleRunner = (
  scenario: Scenario,
) => Promise<{
  evidenceScope: "SYNTHETIC_EXAMPLE";
  capture: VolumeCapture;
  exit: VolumeExit | null;
}>;
const reasonLabel: Record<string, string> = {
  ESTIMATED_NEXT_QUOTE_ADMISSION: "Passed the paper-replay safeguards",
  CONCURRENT_CAPACITY_FULL: "Blocked: all three shared slots are occupied",
  NOT_A_CANDIDATE: "Not eligible: required signal or evidence missing",
  INVALID_ADMISSION_EVIDENCE: "Blocked: incomplete admission evidence",
  NEXT_ELIGIBLE_QUOTE_REQUIRED: "Blocked: entry quote must follow the completed signal",
  LIMIT_NOT_MARKETABLE_NO_FILL: "No modeled fill at the fixed limit",
  EXIT_DUE_WITHOUT_ELIGIBLE_QUOTE: "Exit due, but no eligible quote is available",
};
const defaultRun: VolumeExampleRunner = (scenario) =>
  runVolumeSyntheticExample({ data: { scenario } });
export function VolumeResearch({ runExample = defaultRun }: { runExample?: VolumeExampleRunner }) {
  const [scenario, setScenario] = useState<Scenario>("qualifying");
  const [response, setResponse] = useState<Awaited<ReturnType<VolumeExampleRunner>> | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function run() {
    if (busy) return;
    setBusy(true);
    setResponse(null);
    setError(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("TIMEOUT")), 12000);
      });
      setResponse(await Promise.race([runExample(scenario), timeout]));
    } catch {
      setError(
        "The research example could not run. No order was created. Retry when the service is available.",
      );
    } finally {
      if (timer) clearTimeout(timer);
      setBusy(false);
    }
  }
  return (
    <section
      className="rounded-lg border border-border bg-surface p-4 md:p-6"
      aria-labelledby="volume-v21-title"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Volume v2.1 · research only · execution disabled
      </p>
      <h2 id="volume-v21-title" className="mt-2 text-xl font-semibold">
        Audited volume research workbench
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Hard gates replace the weighted score. Time-matched cumulative, 30-minute and bar volume
        remain separate. Candidates are not trades, and three concurrent positions do not mean three
        entries per day.
      </p>
      <div className="mt-4 rounded-md border border-border bg-subtle p-4 text-sm" role="note">
        <strong>No validated edge or automated execution.</strong> Historical candidate census and
        quote-based estimated replay are available in the research code. A trusted real-data adapter
        and production scheduler are not connected. Paper fills do not establish real-market
        slippage.
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-1 text-sm">
          <label htmlFor="volume-scenario">Fictional audit scenario</label>
          <select
            id="volume-scenario"
            value={scenario}
            disabled={busy}
            onChange={(e) => {
              setScenario(e.target.value as Scenario);
              setResponse(null);
              setError(null);
            }}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-base"
          >
            <option value="qualifying">Qualifying setup and later quote</option>
            <option value="capacity_full">All three shared slots occupied</option>
            <option value="missing_data">Source verification missing</option>
            <option value="low_liquidity">Liquidity requires a smaller order</option>
            <option value="same_bar_entry">Reject entry at the signal close</option>
            <option value="missing_exit">Exit quote missing: retain exposure</option>
          </select>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          {busy ? "Checking safeguards…" : "Run volume audit example"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {response ? (
        <div className="mt-4 rounded-md border border-border p-4" role="status">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Synthetic inputs · estimated model · no real positions
          </p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Candidate observations</dt>
              <dd>{response.capture.candidateCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Qualifying observations</dt>
              <dd>{response.capture.qualifyingCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Simulated admissions</dt>
              <dd>{response.capture.simulatedAdmissionCount}</dd>
            </div>
          </dl>
          {response.capture.portfolioLedger.map((p) => (
            <p className="mt-3 break-words text-sm" key={p.candidateId}>
              {p.securityId}:{" "}
              {reasonLabel[p.reason] ??
                "Blocked by a research safeguard; inspect the recorded evidence"}{" "}
              · modeled shares {p.shares}
            </p>
          ))}
          {response.exit ? (
            <p className="mt-3 text-sm">
              Exit check:{" "}
              {reasonLabel[response.exit.reason] ?? "Inspect the recorded exit evidence"}. Capacity
              released: {response.exit.capacityReleased ? "yes, in the model only" : "no"}.
            </p>
          ) : null}
          <details className="mt-3 text-sm">
            <summary className="min-h-11 cursor-pointer font-medium">
              Evidence and gate details
            </summary>
            {response.capture.candidateLedger.map((c) => (
              <div key={c.candidateId} className="mt-2">
                <p>
                  {c.securityId}: {c.reasons.join(", ")}
                </p>
                <p>
                  Cumulative RVOL: {c.rvolCumulative ?? "unavailable"}; 30-minute RVOL:{" "}
                  {c.rvolWindow30 ?? "not yet available"}; bar RVOL: {c.rvolBar ?? "unavailable"}
                </p>
              </div>
            ))}
            <p className="mt-2 break-all font-mono text-xs">
              Capture digest: {response.capture.captureHash}
            </p>
            <p className="mt-2 text-xs text-muted">
              A digest identifies supplied inputs. It does not attest provider authenticity or
              out-of-sample performance.
            </p>
          </details>
        </div>
      ) : null}
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Validation reports retain daily portfolio returns and within-session clustering. Incomplete
        trial history, missing data and uncomputed diagnostics remain inconclusive. No automatic
        threshold tuning or promotion is enabled.
      </p>
    </section>
  );
}
