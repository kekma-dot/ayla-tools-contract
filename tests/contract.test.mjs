import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCountdown,
  publishSignal,
  readSignals,
  resetSignals,
  signalStore,
} from "../index.mjs";

test("signalStore is process-wide and shared across fresh module instances", async () => {
  resetSignals();
  const fresh = await import(`../index.mjs?fresh=${Date.now()}`);
  publishSignal("voice", { state: "connected" });
  assert.equal(fresh.readSignals().voice.state, "connected", "a re-imported copy sees the same store through Symbol.for");
  assert.equal(fresh.signalStore(), signalStore(), "both module instances return the identical store object");
  resetSignals();
});

test("publishSignal writes one scope and clears only that scope on undefined", () => {
  resetSignals();
  publishSignal("quota", { remaining: 42 });
  publishSignal("voice", { state: "off" });
  publishSignal("quota", undefined);
  const signals = readSignals();
  assert.equal(signals.quota, null, "undefined clears the owning producer's scope");
  assert.deepEqual(signals.voice, { state: "off" }, "other producers are not erased");
  resetSignals();
});

test("publishSignal accepts unknown scopes without leaking them into readSignals", () => {
  resetSignals();
  publishSignal("custom-producer", { any: "thing" });
  assert.deepEqual(signalStore()["custom-producer"], { any: "thing" });
  assert.deepEqual(readSignals(), { quota: null, voice: null, memory: null, transport: null, working: null });
  resetSignals();
});

test("readSignals returns a fresh shallow snapshot of the five contract scopes", () => {
  resetSignals();
  publishSignal("working", { active: true });
  const snapshot = readSignals();
  assert.deepEqual(Object.keys(snapshot).sort(), ["memory", "quota", "transport", "voice", "working"]);
  snapshot.voice = { replaced: true };
  assert.equal(readSignals().voice, null, "rebinding a scope on the snapshot does not touch the store");
  assert.equal(readSignals().working, snapshot.working, "scope objects are shared references by design (shallow snapshot)");
  resetSignals();
});

test("resetSignals replaces the store and clears every producer", () => {
  publishSignal("voice", { state: "error" });
  publishSignal("custom", 1);
  const before = signalStore();
  resetSignals();
  assert.notEqual(signalStore(), before);
  assert.deepEqual(readSignals(), { quota: null, voice: null, memory: null, transport: null, working: null });
  assert.equal(signalStore().custom, undefined, "non-contract scopes are reset too");
});

test("formatCountdown renders bounded human countdowns", () => {
  assert.equal(formatCountdown(0), "");
  assert.equal(formatCountdown(-5), "");
  assert.equal(formatCountdown(Number.NaN), "");
  assert.equal(formatCountdown(Number.POSITIVE_INFINITY), "");
  assert.equal(formatCountdown("not-a-number"), "");
  assert.equal(formatCountdown(30_000), "1m", "sub-minute values round up to 1m");
  assert.equal(formatCountdown(59 * 60_000), "59m");
  assert.equal(formatCountdown(60 * 60_000), "1h");
  assert.equal(formatCountdown(90 * 60_000), "1h30m");
  assert.equal(formatCountdown(47 * 60 * 60_000), "47h");
  assert.equal(formatCountdown(48 * 60 * 60_000), "2d");
  assert.equal(formatCountdown(49 * 60 * 60_000), "2d1h");
});
