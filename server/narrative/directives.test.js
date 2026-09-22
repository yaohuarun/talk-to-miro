import { describe, expect, it } from "vitest";
import { approveNarrative, normalizeNarrative, toDirective } from "./directives.js";

describe("canonical performance directives", () => {
  it("normalizes invalid optional visual fields without losing safe text", () => {
    expect(normalizeNarrative({ segments: [{ text: "咖啡还热着", emotion: "evil", action: "script", event: "url", clue: 3 }], nextBeat: "talk" }).segments[0]).toEqual({ text: "咖啡还热着", emotion: "calm", action: "none", event: "none", clue: null });
  });
  it("gates photo and disclosure events by dialogue and story state", () => {
    const base = { emotion: "calm", action: "none", clue: null };
    expect(approveNarrative({ segments: [{ text: "天气不错", ...base, event: "photo-reveal" }], nextBeat: "talk" }, { beat: "opening", clues: [] }).segments[0].event).toBe("none");
    expect(approveNarrative({ segments: [{ text: "给你看这张照片", ...base, event: "photo-reveal" }], nextBeat: "talk" }, { beat: "opening", clues: [] }).segments[0].event).toBe("photo-reveal");
    expect(approveNarrative({ segments: [{ text: "普通回答", ...base, event: "lightning" }], nextBeat: "talk" }, { beat: "opening", clues: [] }).segments[0].event).toBe("none");
  });
  it("maps semantic values into a closed versioned directive", () => {
    const directive = toDirective({ text: "我在等他", emotion: "vulnerable", action: "look-window", event: "lightning", clue: "waiting-person" }, "disclosure");
    expect(directive).toMatchObject({ version: 1, character: { emotion: "vulnerable", action: "look-at-window" }, cinematic: { camera: "slow-push-in" }, story: { nextBeat: "disclosure" } });
  });
});
