import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// No inherited credentials or database and no outbound broker requests in this test.
process.env.DATABASE_URL = "";
process.env.SLEEVE_SCHEDULER_DEFAULT_ON = "0";
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "@/lib/db") return { url: new URL("./grok-paper-db.fixture.mjs", import.meta.url).href, shortCircuit: true };
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(fileURLToPath(url) + ".ts")) {
        return { url: url.href + ".ts", shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

test("actual Alpaca adapter: real SQL, isolated fake broker, durable replay and confirmed exits", async (t) => {
  const pg = new PGlite();
  await pg.waitReady;
  await pg.exec("CREATE TABLE app_keyring (key_id text primary key, purpose text, key_bytes bytea, created_at timestamptz)");
  let failInsert = false, failUpdate = false;
  const makeSql = (execute) => ({
    async query(text, params = []) {
      if (failInsert && text.includes("INSERT INTO alpaca_order_log")) throw new Error("TEST_INTENT_WRITE_FAILED");
      if (failUpdate && text.includes("UPDATE alpaca_order_log")) throw new Error("TEST_RECEIPT_WRITE_FAILED");
      return (await execute(text, params)).rows;
    },
  });
  globalThis.__grokPaperTestSql = makeSql((text, params) => pg.query(text, params));
  globalThis.__grokPaperTestTransaction = (fn) => pg.transaction((tx) => fn(makeSql((text, params) => tx.query(text, params))));
  const originalFetch = globalThis.fetch;
  const orders = new Map();
  let posts = 0, closes = 0, losePostResponse = false, loseCloseResponse = false;
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://paper-api.alpaca.markets", "No live or external network access allowed");
    if (url.pathname === "/v2/account") return json({ id: "fixture-account", status: "ACTIVE", account_number: "PAPER1234", trading_blocked: false });
    if (url.pathname === "/v2/clock") return json({ is_open: true, timestamp: "2026-09-16T14:00:00Z" });
    if (url.pathname === "/v2/positions") return json([]);
    if (url.pathname === "/v2/orders" && !init.method) return json([...orders.values()].filter((r) => ["accepted", "partially_filled", "new"].includes(r.status)));
    if (url.pathname === "/v2/orders" && init.method === "POST") {
      const body = JSON.parse(init.body);
      const saved = (await pg.query("SELECT status FROM alpaca_order_log WHERE client_order_id = $1", [body.client_order_id])).rows;
      assert.equal(saved[0]?.status, "SUBMITTING", "The durable intent must exist before the broker POST");
      posts++;
      const receipt = { ...body, id: "fixture-order-" + posts, status: "accepted", filled_qty: "0" };
      orders.set(body.client_order_id, receipt);
      if (losePostResponse) throw new Error("TEST_RESPONSE_LOST_AFTER_ACCEPTANCE");
      return json(receipt);
    }
    if (url.pathname === "/v2/orders:by_client_order_id") {
      const order = orders.get(url.searchParams.get("client_order_id"));
      return order ? json(order) : json({ message: "not found" }, 404);
    }
    if (url.pathname.startsWith("/v2/orders/")) {
      const order = [...orders.values()].find((r) => r.id === url.pathname.split("/").at(-1));
      return order ? json(order) : json({ message: "not found" }, 404);
    }
    if (url.pathname.startsWith("/v2/positions/") && init.method === "DELETE") {
      closes++;
      const receipt = { id: "fixture-exit-" + closes, client_order_id: "exit-" + closes, status: "accepted", qty: "2", filled_qty: "0" };
      orders.set(receipt.client_order_id, receipt);
      if (loseCloseResponse) throw new Error("TEST_EXIT_RESPONSE_LOST");
      return json(receipt);
    }
    throw new Error("Unmocked network request blocked: " + url.pathname);
  };
  try {
    const broker = await import("../src/desk/alpaca.ts");
    await broker.saveCredentials({ apiKeyId: "PKFIXTURE000000000000", apiSecret: "TEST_ONLY_NOT_A_REAL_SECRET_00000000000000", mode: "PAPER", actor: "test-operator" });
    t.afterEach(async () => {
      // Simulate completed-and-closed fixture trades between independent scenarios.
      await pg.query(`UPDATE alpaca_order_log SET raw_receipt = raw_receipt || '{"_grok_capacity_settled":true}'::jsonb`);
      orders.clear();
    });
    const ticket = { symbol: "AAPL", side: "buy", type: "market", timeInForce: "day", notional: "100.00", actor: "test-operator" };
    await t.test("persist intent then submit, replay without duplicate, and reject changed payload", async () => {
      const first = await broker.submitOrder({ ...ticket, requestId: "adapter-one" });
      const replay = await broker.submitOrder({ ...ticket, requestId: "adapter-one" });
      assert.equal(first.id, replay.id); assert.equal(posts, 1); assert.equal(replay._grok_replayed, true);
      await assert.rejects(broker.submitOrder({ ...ticket, notional: "200.00", requestId: "adapter-one" }), /different ticket/);
      assert.equal(posts, 1);
    });
    await t.test("intent database failure prevents POST", async () => {
      failInsert = true;
      await assert.rejects(broker.submitOrder({ ...ticket, requestId: "insert-failure" }), /TEST_INTENT_WRITE_FAILED/);
      failInsert = false; assert.equal(posts, 1);
    });
    await t.test("receipt database failure recovers the same broker order", async () => {
      failUpdate = true;
      await assert.rejects(broker.submitOrder({ ...ticket, requestId: "save-failure" }), /TEST_RECEIPT_WRITE_FAILED/);
      failUpdate = false;
      const recovered = await broker.submitOrder({ ...ticket, requestId: "save-failure" });
      assert.equal(recovered._grok_replayed, true); assert.equal(posts, 2);
    });
    await t.test("lost HTTP response does not send another order", async () => {
      losePostResponse = true;
      await assert.rejects(broker.submitOrder({ ...ticket, requestId: "lost-response" }));
      losePostResponse = false;
      const recovered = await broker.submitOrder({ ...ticket, requestId: "lost-response" });
      assert.equal(recovered._grok_replayed, true); assert.equal(posts, 3);
    });
    await t.test("zero sizes rejected and automatic IDs remain stable across actors", async () => {
      await assert.rejects(broker.submitOrder({ ...ticket, notional: "0.00", requestId: "zero" }), /positive/);
      await broker.submitOrder({ ...ticket, requestScope: "auto", requestId: "same-cycle" });
      await broker.submitOrder({ ...ticket, actor: "other-operator", requestScope: "auto", requestId: "same-cycle" });
      assert.equal(posts, 4);
    });
    await t.test("concurrent manual and strategy buys share the three-slot / 15000 cap", async () => {
      const before = posts;
      const requests = ["NVDA", "MSFT", "AMD", "TSLA"].map((symbol, i) => ({ ...ticket, symbol, notional: "5000.00", requestId: "concurrent-" + i, actor: "actor-" + i }));
      await Promise.allSettled(requests.map((request) => broker.submitOrder(request)));
      for (const request of requests) { try { await broker.submitOrder(request); } catch { /* fail-closed admission */ } }
      assert.equal(posts - before, 3);
      await assert.rejects(broker.submitOrder({ ...ticket, symbol: "GOOGL", requestId: "fourth-slot" }), /slot cap/);
      assert.equal(posts - before, 3);
    });
    const auto = await import("../src/desk/auto-trade.ts");
    await auto.listFills();
    await pg.exec(readFileSync(new URL("../migrations/0007_paper_exit_receipts.sql", import.meta.url), "utf8"));
    await t.test("accepted exit stays pending, polls original ID, and only full fill closes", async () => {
      await pg.query("INSERT INTO alpaca_desk_fill (position_id,symbol,side,status,alpaca_order_id) VALUES ('p-one','AAPL','buy','FILLED','original-entry')");
      const args = { positionId: "p-one", ticker: "AAPL", actor: "test-operator" };
      assert.equal(await auto.sendExit(args), false); assert.equal(closes, 1);
      let row = (await pg.query("SELECT * FROM alpaca_desk_fill WHERE position_id='p-one'")).rows[0];
      assert.equal(row.status, "EXIT_SUBMITTED"); assert.equal(row.alpaca_order_id, "original-entry"); assert.equal(row.closed_at, null);
      assert.equal(await auto.sendExit(args), false); assert.equal(closes, 1);
      orders.get("exit-1").status = "filled"; orders.get("exit-1").filled_qty = "2";
      assert.equal(await auto.sendExit(args), true);
      row = (await pg.query("SELECT * FROM alpaca_desk_fill WHERE position_id='p-one'")).rows[0];
      assert.equal(row.status, "CLOSED"); assert.ok(row.closed_at); assert.equal(closes, 1);
    });
    await t.test("uncertain close is retained and never blindly repeated", async () => {
      await pg.query("INSERT INTO alpaca_desk_fill (position_id,symbol,side,status) VALUES ('p-two','MSFT','buy','FILLED')");
      const args = { positionId: "p-two", ticker: "MSFT", actor: "test-operator" };
      loseCloseResponse = true;
      assert.equal(await auto.sendExit(args), false); assert.equal(closes, 2);
      loseCloseResponse = false;
      assert.equal(await auto.sendExit(args), false); assert.equal(closes, 2);
      const row = (await pg.query("SELECT status,last_error FROM alpaca_desk_fill WHERE position_id='p-two'")).rows[0];
      assert.equal(row.status, "EXIT_PENDING"); assert.ok(row.last_error);
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.__grokPaperTestSql;
    delete globalThis.__grokPaperTestTransaction;
    hooks.deregister();
    await pg.close();
  }
});
