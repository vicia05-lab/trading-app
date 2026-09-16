import assert from "node:assert/strict";
import { test } from "node:test";
import { buyReservationNotional, reservationSettled } from "./paper-order-admission.ts";
test("notional admission uses exact cents and limit buy size rounds upward", () => {
  assert.equal(buyReservationNotional({ type: "market", notional: "5000.00" }), "5000.00");
  assert.equal(buyReservationNotional({ type: "limit", qty: "2.123456789", limitPrice: "100.0001" }), "212.35");
  assert.throws(() => buyReservationNotional({ type: "market", qty: "1" }), /dollar notional/);
});
test("reservations cannot disappear on pending, partial, missing or replaced receipts", () => {
  for (const status of ["accepted", "partially_filled", "replaced", "unknown"]) {
    assert.equal(reservationSettled({ status, symbol: "AAPL", filled_qty: "1" }, [{ symbol: "AAPL", qty: "1" }]), false);
  }
  assert.equal(reservationSettled({ status: "filled", symbol: "AAPL", filled_qty: "1" }, []), false);
  assert.equal(reservationSettled({ status: "filled", symbol: "AAPL", filled_qty: "2" }, [{ symbol: "AAPL", qty: "1" }]), false);
});
test("terminal receipts release reservations only with zero fills or holdings evidence", () => {
  assert.equal(reservationSettled({ status: "canceled", filled_qty: "0" }, []), true);
  assert.equal(reservationSettled({ status: "filled", symbol: "AAPL", filled_qty: "2.500" }, [{ symbol: "AAPL", qty: "2.5" }]), true);
  assert.equal(reservationSettled({ status: "filled", filled_qty: "0" }, []), false);
});
