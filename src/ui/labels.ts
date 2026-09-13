export function decisionLabel(status: string | null | undefined, reasons: string[] = []): string {
  if (!status || status === "NO_FREEZE") return "No decision recorded";
  if (status === "PREDICT") return "Upward expectation";
  if (status === "STAND_DOWN") {
    if (reasons.some((r) => r.startsWith("MISSING_"))) return "Not enough information";
    return "No qualifying setup";
  }
  return "Unknown status";
}

export function paperLabel(execution: string | null | undefined, decision?: string | null): string {
  if (execution === "PAPER_COMMITTED") return "Paper position reserved";
  if (execution === "NOT_TRADED") return "Predicted · not traded";
  if (!decision || decision === "STAND_DOWN" || decision === "NO_FREEZE") return "Not applicable";
  if (execution === "DENIED") return "Predicted · not traded";
  if (execution === "NONE" || !execution) return "Not applicable";
  return execution;
}

export function positionStateLabel(state: string): string {
  switch (state) {
    case "COMMITTED_IRREVOCABLE":
      return "Paper position reserved";
    case "FILLED":
      return "Paper position open";
    case "IMPAIRED_ENTRY":
      return "Entry price unresolved";
    case "IMPAIRED_EXIT":
      return "Exit price unresolved";
    case "NO_FILL":
      return "No modeled fill · closing record";
    case "FLAT":
      return "Exit recorded · closing record";
    case "CLOSED":
      return "Paper position closed";
    default:
      return "Unknown status";
  }
}

export function infoStatus(cardComplete: boolean, optionsValid: boolean | null): string {
  if (cardComplete && optionsValid !== false) return "Ready";
  if (optionsValid === false) return "Invalid source value";
  return "Missing information";
}

export function timingLabel(quality: string): string {
  if (quality === "ISSUER_CONFIRMED") return "After close · issuer confirmed";
  if (quality === "VENDOR_CONFIRMED") return "After close · vendor confirmed";
  return "Timing not confirmed";
}

export function reasonSentence(code: string): string {
  const map: Record<string, string> = {
    ADMITTED: "A simulated position was reserved.",
    NOT_PREDICTED: "The rule did not select a trade setup.",
    CARD_INCOMPLETE: "Required information was not complete when the decision was recorded.",
    OPTIONS_INVALID: "The options input was not usable.",
    IMPLIED_MOVE_OUT_OF_BAND: "The options-implied move proxy was outside the allowed band.",
    REL5_NOT_NEGATIVE: "Five-day performance was not below the benchmark.",
    REL63_NOT_POSITIVE: "Sixty-three-day performance was not above the benchmark.",
    TIMING_NOT_CONFIRMED: "Earnings timing was not issuer-confirmed after close.",
    MISSING_IMPLIED_MOVE: "The options-implied move proxy was not available.",
    MISSING_REL5: "The five-day relative return was not available.",
    MISSING_REL63: "The 63-day relative return was not available.",
    CAPACITY_SLOTS: "Paper-position slot capacity was reached.",
    CAPACITY_NOTIONAL: "Reserved simulated notional capacity was reached.",
    PER_EVENT_LIMIT: "This session's paper-position limit was reached.",
    ALREADY_OWNED: "This company already had an unresolved paper position.",
    PAUSED: "New paper positions are paused.",
    CUTOFF: "The decision deadline had passed.",
    STALE_QUOTE: "The quote was too old for admission.",
    WIDE_SPREAD: "The quoted spread was too wide for admission.",
    PRICE_BELOW_MIN: "The price was below the admission minimum.",
    NO_QUOTE: "A usable quote was not available.",
    PREDICATE_FALSE_implied_move: "The expected move was outside the allowed band.",
    PREDICATE_FALSE_benchmark_relative_5d: "Five-day performance was not below the market by enough.",
    PREDICATE_FALSE_benchmark_relative_63d: "Sixty-three-day performance was not above the market by enough.",
    PREDICATE_FALSE_timing_quality: "Earnings timing was not issuer-confirmed after close.",
    PREDICATE_FALSE_card_complete: "Required information was not complete.",
    PREDICATE_FALSE_options_valid: "The options input was not usable.",
  };
  return map[code] ?? code.replaceAll("_", " ").toLowerCase();
}

export function mainReason(reasons: string[]): string {
  const skip = new Set(["ADMITTED", "PREDICT", "LONG"]);
  const first = reasons.find((r) => !skip.has(r));
  return first ? reasonSentence(first) : "The recorded predicates were evaluated in registered order.";
}

export function jobPurpose(name: string): string {
  const map: Record<string, string> = {
    "premarket-check": "Collect data",
    "capture-cycle": "Collect data",
    "seal-session": "Lock inputs",
    "ordered-freeze": "Record decisions",
    "due-deadlines": "Apply deadlines",
    "mark-ingest": "Process official prices",
    "grade-apply": "Prepare reports",
    "report-finalize": "Release review window",
    "learn-revise": "Update next-session checklist",
  };
  return map[name] ?? name.replaceAll("-", " ");
}

export function formatSession(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const d = new Date(`${iso}T16:00:00-04:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function money(v: string | number | null | undefined, digits = 0): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pct(v: string | null | undefined): string {
  if (!v) return "Not available";
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return `${(n * 100).toFixed(2)}%`;
}

export function verificationLabel(level: string | null | undefined): string {
  switch (level) {
    case "BYTE_VERIFIED":
      return "Inputs replay verified";
    case "ATTESTED":
      return "Prior verification retained";
    case "HASH_ONLY":
      return "Record hashes verified";
    default:
      return "Verification unavailable";
  }
}

export function alarmLabel(code: string): { title: string; detail: string } {
  switch (code) {
    case "EXIT_EVIDENCE_UNRESOLVED":
      return {
        title: "Exit price not available",
        detail: "A simulated position is waiting for an official close. It is not a live order.",
      };
    case "DESK_CAPACITY_BLOCKED_ON_MARKS":
      return {
        title: "New simulated positions paused",
        detail: "A reserved paper slot stays occupied until the missing official price is resolved.",
      };
    case "FREEZE_ARTIFACT_MISMATCH":
      return {
        title: "Recorded decision could not be replayed",
        detail: "The saved freeze did not match a fresh check of the sealed inputs and rule. It is not a live order.",
      };
    case "OFF_DESIGN_EARLY_RELEASE":
      return {
        title: "Early result knowledge recorded",
        detail: "New simulated entries stay paused until this review record is closed.",
      };
    default:
      return {
        title: "Needs review",
        detail: "The desk recorded an open issue. It does not place a live order.",
      };
  }
}
