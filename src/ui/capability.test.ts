import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { capabilityLabel } from "./capability.ts";

describe("capability labels", () => {
  it("never converts a missing check into Ready", () => {
    assert.equal(capabilityLabel(undefined), "Not checked");
    assert.equal(capabilityLabel(null), "Not checked");
    assert.equal(capabilityLabel("not_checked"), "Not checked");
    assert.equal(capabilityLabel("ready"), "Ready");
    assert.equal(capabilityLabel("sample"), "Sample data");
    assert.equal(capabilityLabel("failed"), "Failed");
  });
});
