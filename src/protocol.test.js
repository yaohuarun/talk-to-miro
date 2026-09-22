import { describe, expect, it } from "vitest";
import {
  sanitizePerformance,
  sanitizePresentation,
  parseDirective,
  sceneFromEvent,
  TurnGate,
} from "./protocol.js";
describe("performance protocol", () => {
  it("drops unsupported media and effects", () =>
    expect(
      sanitizePerformance({
        effects: ["lightning", "inject"],
        media: [{ type: "script", asset: "x" }],
      }),
    ).toMatchObject({ effects: ["lightning"], media: [] }));
  it("rejects stale output after an interruption", () => {
    const gate = new TurnGate();
    const first = gate.begin();
    const second = gate.begin();
    expect(gate.accepts(first)).toBe(false);
    expect(gate.accepts(second)).toBe(true);
  });
  it("uses Mira as the safe default subtitle speaker", () => {
    expect(sanitizePresentation()).toEqual({ speaker: "mira" });
    expect(sanitizePresentation({ speaker: "narrator" })).toEqual({
      speaker: "narrator",
    });
  });
  it("accepts versioned directives and falls back safely", () => {
    const directive = { version: 1, character: { emotion: "vulnerable", expression: "soft-smile", pose: "softened", action: "look-at-window" }, cinematic: { camera: "slow-push-in", environment: "lightning-window" }, effects: ["lightning", "inject"], story: { nextBeat: "disclosure", clue: "waiting-person" }, media: [{ type: "image-reveal", asset: "polaroid-rainy-street" }] };
    expect(parseDirective(directive)).toMatchObject({ character: { emotion: "vulnerable" }, effects: ["lightning"] });
    expect(parseDirective({ ...directive, version: 2 })).toBeNull();
    expect(sceneFromEvent({ directive: { ...directive, version: 2 }, performance: { emotion: "evil", action: "script", effects: ["inject"], media: [{ type: "image-reveal", asset: "https://evil" }] } })).toMatchObject({ character: { emotion: "calm", action: "idle" }, media: [] });
  });
});
