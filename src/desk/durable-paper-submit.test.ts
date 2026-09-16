import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dispatchAuditedPaperOrder, paperClientOrderId, paperExitStatus, type PaperReceipt } from "./durable-paper-submit.ts";

function fixture() {
  const clientOrderId = paperClientOrderId("operator", "request-1");
  const receipt: PaperReceipt = { id: "broker-order", client_order_id: clientOrderId, status: "accepted" };
  let claimed = false, stored: PaperReceipt | null = null, posts = 0;
  return {
    receipt,
    get posts() { return posts; },
    args: {
      clientOrderId,
      claim: async () => { if (claimed) return false; claimed = true; return true; },
      load: async () => stored,
      send: async () => { posts++; return receipt; },
      lookup: async () => receipt,
      save: async (r: PaperReceipt) => { stored = r; },
    },
  };
}

describe("durable paper submission", () => {
  it("uses stable strategy-scoped IDs within the broker's 48-character limit", () => {
    const a = paperClientOrderId("a", "x");
    assert.equal(a, paperClientOrderId("a", "x"));
    assert.notEqual(a, paperClientOrderId("b", "x"));
    assert.ok(a.length <= 48);
  });
  it("does not POST when the durable intent write fails", async () => {
    const f = fixture(); f.args.claim = async () => { throw new Error("database unavailable"); };
    await assert.rejects(dispatchAuditedPaperOrder(f.args)); assert.equal(f.posts, 0);
  });
  it("does not POST twice on a retry", async () => {
    const f = fixture(); await dispatchAuditedPaperOrder(f.args); await dispatchAuditedPaperOrder(f.args);
    assert.equal(f.posts, 1);
  });
  it("recovers a broker acceptance after the receipt write failed", async () => {
    const f = fixture(), save = f.args.save;
    f.args.save = async () => { throw new Error("database unavailable"); };
    await assert.rejects(dispatchAuditedPaperOrder(f.args));
    f.args.save = save; assert.equal((await dispatchAuditedPaperOrder(f.args)).id, "broker-order");
    assert.equal(f.posts, 1);
  });
  it("does not retry a timeout as a new order", async () => {
    const f = fixture(); let posts = 0;
    f.args.send = async () => { posts++; throw new Error("timeout"); };
    await assert.rejects(dispatchAuditedPaperOrder(f.args));
    await dispatchAuditedPaperOrder(f.args); assert.equal(posts, 1);
  });
  it("retains an unknown outcome without a blind POST retry", async () => {
    const f = fixture(); await f.args.claim();
    f.args.lookup = async () => null as unknown as PaperReceipt;
    await assert.rejects(dispatchAuditedPaperOrder(f.args), /RECONCILIATION_REQUIRED/); assert.equal(f.posts, 0);
  });
  it("rejects a receipt belonging to another request", async () => {
    const f = fixture(); f.args.send = async () => ({ ...f.receipt, client_order_id: "other" });
    await assert.rejects(dispatchAuditedPaperOrder(f.args), /RECONCILIATION_REQUIRED/);
  });
  it("concurrent claims send at most once", async () => {
    const f = fixture(); await Promise.allSettled([dispatchAuditedPaperOrder(f.args), dispatchAuditedPaperOrder(f.args)]);
    assert.equal(f.posts, 1);
  });
});

describe("paper exit receipt", () => {
  it("keeps accepted and partial exits pending", () => {
    assert.equal(paperExitStatus({ id: "x", status: "accepted" }), "EXIT_SUBMITTED");
    assert.equal(paperExitStatus({ id: "x", status: "partially_filled", qty: "2", filled_qty: "1" }), "EXIT_SUBMITTED");
  });
  it("requires full quantity evidence before CLOSED", () => {
    assert.equal(paperExitStatus({ id: "x", status: "filled" }), "EXIT_SUBMITTED");
    assert.equal(paperExitStatus({ id: "x", status: "filled", qty: "2.500", filled_qty: "2.5" }), "CLOSED");
  });
  it("does not count terminal rejections as closes", () => {
    assert.equal(paperExitStatus({ id: "x", status: "rejected" }), "EXIT_ERROR");
    assert.throws(() => paperExitStatus({ status: "filled" }));
  });
});
