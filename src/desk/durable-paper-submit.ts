import { createHash } from "node:crypto";

export type PaperReceipt = Record<string, string | boolean | null>;

export function paperClientOrderId(actor: string, requestId: string): string {
  if (!requestId || requestId.length > 160) throw new Error("INVALID_REQUEST_ID");
  return "grok-" + createHash("sha256").update(actor + "\0" + requestId).digest("hex").slice(0, 36);
}

export function confirmedReceipt(value: PaperReceipt | null, clientOrderId: string): value is PaperReceipt {
  return Boolean(value && typeof value.id === "string" && value.id.length > 0
    && value.client_order_id === clientOrderId && typeof value.status === "string" && value.status.length > 0);
}

/** Persist the intent before POST. A retry looks up the original ID; it never repeats POST. */
export async function dispatchAuditedPaperOrder(args: {
  clientOrderId: string;
  claim: () => Promise<boolean>;
  load: () => Promise<PaperReceipt | null>;
  send: () => Promise<PaperReceipt>;
  lookup: () => Promise<PaperReceipt | null>;
  save: (receipt: PaperReceipt) => Promise<void>;
}): Promise<PaperReceipt> {
  const claimed = await args.claim();
  if (!claimed) {
    const saved = await args.load();
    if (confirmedReceipt(saved, args.clientOrderId)) return { ...saved, _grok_replayed: true };
    const recovered = await args.lookup();
    if (!confirmedReceipt(recovered, args.clientOrderId)) {
      throw new Error("RECONCILIATION_REQUIRED: the original paper order is not confirmed. No duplicate order was sent.");
    }
    await args.save(recovered);
    return { ...recovered, _grok_replayed: true };
  }
  const receipt = await args.send();
  if (!confirmedReceipt(receipt, args.clientOrderId)) {
    throw new Error("RECONCILIATION_REQUIRED: incomplete broker receipt. The durable intent has been retained.");
  }
  await args.save(receipt);
  return { ...receipt, _grok_replayed: false };
}

/** A close request is not a completed exit, including partial fills. */
export function paperExitStatus(receipt: PaperReceipt): "CLOSED" | "EXIT_SUBMITTED" | "EXIT_ERROR" {
  if (typeof receipt.id !== "string" || !receipt.id) throw new Error("Missing exit order receipt");
  const status = String(receipt.status ?? "").toLowerCase();
  if (["rejected", "canceled", "expired"].includes(status)) return "EXIT_ERROR";
  if (status !== "filled") return "EXIT_SUBMITTED";
  const scale = (v: unknown) => {
    if (typeof v !== "string" || !/^[0-9]+(?:\.[0-9]{1,9})?$/.test(v)) return null;
    const [whole, fraction = ""] = v.split(".");
    return BigInt(whole) * 1000000000n + BigInt(fraction.padEnd(9, "0"));
  };
  const qty = scale(receipt.qty), filled = scale(receipt.filled_qty);
  return qty !== null && filled !== null && qty > 0n && filled >= qty ? "CLOSED" : "EXIT_SUBMITTED";
}
