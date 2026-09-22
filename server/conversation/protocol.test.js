import { describe, expect, it } from "vitest";
import { directiveSchema, parseClientEvent, narrativeSchema } from "./protocol.js";
const base = {
  v: 1,
  sessionId: "session-123",
  token: "token-1234567890123456",
  turnId: 1,
};
describe("conversation contracts", () => {
  it("accepts bounded text and rejects unknown or malformed fields", () => {
    expect(
      parseClientEvent({ ...base, type: "input.text", text: "你好" }).success,
    ).toBe(true);
    expect(
      parseClientEvent({
        ...base,
        type: "input.text",
        text: "你好",
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      parseClientEvent({ ...base, type: "input.audio", sequence: -1, data: "" })
        .success,
    ).toBe(false);
  });
  it("rejects arbitrary narrative directives", () =>
    expect(
      narrativeSchema.safeParse({
        segments: [
          {
            text: "x",
            emotion: "evil",
            action: "script",
            event: "url",
            clue: null,
          },
        ],
        nextBeat: "x",
      }).success,
    ).toBe(false));
  it("accepts only closed versioned scene directives", () => {
    const valid = { version: 1, character: { emotion: "curious", expression: "open-gaze", pose: "attentive", action: "hold-camera" }, cinematic: { camera: "steady", environment: "rainy-cafe" }, effects: ["rain-reflection"], story: { nextBeat: "talk", clue: null, endConversation: false, endReason: null }, media: [{ type: "image-reveal", asset: "polaroid-rainy-street" }] };
    expect(directiveSchema.safeParse(valid).success).toBe(true);
    expect(directiveSchema.safeParse({ ...valid, version: 2 }).success).toBe(false);
    expect(directiveSchema.safeParse({ ...valid, script: "alert(1)" }).success).toBe(false);
    expect(directiveSchema.safeParse({ ...valid, media: [{ type: "image-reveal", asset: "https://evil.test/x" }] }).success).toBe(false);
  });
});
