export const ALLOWED_EFFECTS = new Set([
  "rain-reflection",
  "polaroid-glow",
  "lightning",
  "warm-lamp-dim",
]);
export const MEDIA_REGISTRY = Object.freeze({
  "polaroid-rainy-street": { type: "image-reveal", kind: "dom" },
  "mira-memory-clip": { type: "video", kind: "video" },
});
const EMOTIONS = new Set(["calm", "curious", "hesitant", "vulnerable"]);
const EXPRESSIONS = new Set(["open-gaze", "averted-eyes", "soft-smile"]);
const POSES = new Set(["neutral", "attentive", "guarded", "softened"]);
const ACTIONS = new Set(["idle", "look-at-window", "adjust-raincoat", "hold-camera", "show-photo", "farewell-nod"]);
const CAMERAS = new Set(["steady", "slow-push-in"]);
const ENVIRONMENTS = new Set(["rainy-cafe", "lightning-window", "warm-lamp-dim"]);
export const EMPTY_SCENE = Object.freeze({ character: { emotion: "calm", expression: "open-gaze", pose: "neutral", action: "idle" }, cinematic: { camera: "steady", environment: "rainy-cafe" }, effects: [], media: [] });

export function parseDirective(value) {
  if (!value || value.version !== 1 || typeof value !== "object") return null;
  const character = value.character || {};
  const cinematic = value.cinematic || {};
  if (!EMOTIONS.has(character.emotion) || !EXPRESSIONS.has(character.expression) || !POSES.has(character.pose) || !ACTIONS.has(character.action) || !CAMERAS.has(cinematic.camera) || !ENVIRONMENTS.has(cinematic.environment)) return null;
  const effects = Array.isArray(value.effects) ? value.effects.filter((item) => ALLOWED_EFFECTS.has(item)).slice(0, 4) : [];
  const media = Array.isArray(value.media) ? value.media.filter((item) => MEDIA_REGISTRY[item?.asset]?.type === item?.type).slice(0, 1) : [];
  return { version: 1, character: { emotion: character.emotion, expression: character.expression, pose: character.pose, action: character.action }, cinematic: { camera: cinematic.camera, environment: cinematic.environment }, effects, media, story: value.story && typeof value.story.nextBeat === "string" ? { nextBeat: value.story.nextBeat, clue: typeof value.story.clue === "string" ? value.story.clue : null } : { nextBeat: "opening", clue: null } };
}

export function sceneFromEvent(event) {
  const directive = parseDirective(event?.directive);
  if (directive) return { character: directive.character, cinematic: directive.cinematic, effects: directive.effects, media: directive.media };
  const legacy = sanitizePerformance(event?.performance);
  return { character: { emotion: legacy.emotion, expression: "open-gaze", pose: "neutral", action: legacy.action }, cinematic: { camera: legacy.camera, environment: "rainy-cafe" }, effects: legacy.effects, media: legacy.media };
}
export function sanitizePerformance(value) {
  const safe = value && typeof value === "object" ? value : {};
  return {
    emotion: EMOTIONS.has(safe.emotion) ? safe.emotion : "calm",
    action: ACTIONS.has(safe.action) ? safe.action : "idle",
    camera: CAMERAS.has(safe.camera) ? safe.camera : "steady",
    effects: Array.isArray(safe.effects)
      ? safe.effects.filter((effect) => ALLOWED_EFFECTS.has(effect))
      : [],
    media: Array.isArray(safe.media)
      ? safe.media.filter(
          (item) =>
            item?.type === "image-reveal" &&
            item.asset === "polaroid-rainy-street",
        )
      : [],
  };
}
export class TurnGate {
  constructor() {
    this.activeTurn = 0;
  }
  begin() {
    this.activeTurn += 1;
    return this.activeTurn;
  }
  accepts(turnId) {
    return turnId === this.activeTurn;
  }
}
export function sanitizePresentation(value) {
  return { speaker: value?.speaker === "narrator" ? "narrator" : "mira" };
}
