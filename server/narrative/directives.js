import { directiveSchema, performanceSchema } from "../conversation/protocol.js";

const emotionMap = { warm: "calm", guarded: "hesitant" };
const actionMap = {
  idle: "none",
  "look-at-window": "look-window",
  "soften-posture": "adjust-raincoat",
};
export function fromStoryResult(result, story) {
  const emotion =
    emotionMap[result.performance?.emotion] ||
    result.performance?.emotion ||
    "calm";
  const action =
    actionMap[result.performance?.action] ||
    result.performance?.action ||
    "none";
  const event = result.performance?.media?.length
    ? "photo-reveal"
    : result.performance?.effects?.includes("lightning")
      ? "lightning"
      : "none";
  const clue =
    story.clues.find((item) => !result.beforeClues?.includes(item)) || null;
  return {
    segments: [{ text: result.text, emotion, action, event, clue }],
    nextBeat: story.beat,
  };
}
export function approveNarrative(value, currentStory) {
  const segments = value.segments.map((segment) => {
    const performance = performanceSchema.parse({
      emotion: segment.emotion,
      action: segment.action,
      event: segment.event,
      clue: segment.clue,
    });
    const safe = { text: segment.text, ...performance };
    const photoEligible =
      /照片|相机/.test(safe.text) || currentStory.clues.includes("camera");
    const disclosureEligible = /等|回来|路灯/.test(safe.text) || currentStory.beat === "disclosure" || currentStory.clues.includes("waiting-person");
    return {
      ...safe,
      event:
        safe.event === "photo-reveal" && !photoEligible
          ? "none"
          : safe.event === "lightning" && !disclosureEligible
            ? "none"
            : safe.event,
    };
  });
  return { segments, nextBeat: value.nextBeat };
}
export function normalizeNarrative(value) {
  const source = value && typeof value === "object" ? value : {};
  const segments = Array.isArray(source.segments)
    ? source.segments.slice(0, 3).flatMap((item) => {
        const text = typeof item?.text === "string" ? item.text.trim().slice(0, 80) : "";
        if (!text) return [];
        const parsed = performanceSchema.safeParse({ emotion: item.emotion, action: item.action, event: item.event, clue: item.clue });
        return [{ text, ...(parsed.success ? parsed.data : { emotion: "calm", action: "none", event: "none", clue: null }) }];
      })
    : [];
  if (!segments.length) throw new Error("llm_invalid_dialogue");
  const nextBeat = typeof source.nextBeat === "string" && source.nextBeat.trim() ? source.nextBeat.trim().slice(0, 60) : "opening";
  return { segments, nextBeat };
}
export function toScenePerformance(segment) {
  const action = {
    none: "idle",
    "look-window": "look-at-window",
    "adjust-raincoat": "adjust-raincoat",
    "hold-camera": "hold-camera",
    "show-photo": "show-photo",
    "farewell-nod": "farewell-nod",
  }[segment.action];
  return {
    emotion: segment.emotion,
    expression:
      segment.emotion === "vulnerable"
        ? "soft-smile"
        : segment.emotion === "hesitant"
          ? "averted-eyes"
          : "open-gaze",
    action,
    camera: segment.event === "lightning" ? "slow-push-in" : "steady",
    effects:
      segment.event === "lightning"
        ? ["lightning", "warm-lamp-dim"]
        : segment.event === "photo-reveal"
          ? ["polaroid-glow"]
          : ["rain-reflection"],
    media:
      segment.event === "photo-reveal"
        ? [{ type: "image-reveal", asset: "polaroid-rainy-street" }]
        : [],
  };
}
export function toDirective(segment, nextBeat) {
  const performance = toScenePerformance(segment);
  const pose = segment.emotion === "vulnerable" ? "softened" : segment.emotion === "hesitant" ? "guarded" : segment.emotion === "curious" ? "attentive" : "neutral";
  return directiveSchema.parse({
    version: 1,
    character: { emotion: segment.emotion, expression: performance.expression, pose, action: performance.action },
    cinematic: { camera: performance.camera, environment: segment.event === "lightning" ? "lightning-window" : performance.effects.includes("warm-lamp-dim") ? "warm-lamp-dim" : "rainy-cafe" },
    effects: performance.effects,
    story: { nextBeat, clue: segment.clue, endConversation: Boolean(segment.endConversation), endReason: segment.endConversation ? "user-departure" : null },
    media: performance.media,
  });
}
