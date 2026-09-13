export type CapabilityState =
  | "not_checked"
  | "checking"
  | "not_configured"
  | "unavailable"
  | "failed"
  | "sample"
  | "ready";

export type Capability = {
  id: string;
  label: string;
  state: CapabilityState;
  last_checked: string | null;
  reason: string;
};

/** Never treat a missing record as Ready. */
export function capabilityLabel(state: CapabilityState | null | undefined): string {
  switch (state) {
    case "ready":
      return "Ready";
    case "sample":
      return "Sample data";
    case "not_configured":
      return "Not configured";
    case "unavailable":
      return "Unavailable";
    case "failed":
      return "Failed";
    case "checking":
      return "Checking";
    case "not_checked":
      return "Not checked";
    default:
      return "Not checked";
  }
}

export function capabilityTone(state: CapabilityState | null | undefined): "neutral" | "info" | "success" | "warn" | "danger" {
  switch (state) {
    case "ready":
      return "success";
    case "sample":
      return "info";
    case "failed":
      return "danger";
    case "unavailable":
    case "not_configured":
      return "warn";
    default:
      return "neutral";
  }
}

export function cap(partial: Capability): Capability {
  return {
    id: partial.id,
    label: partial.label,
    state: partial.state,
    last_checked: partial.last_checked,
    reason: partial.reason,
  };
}
