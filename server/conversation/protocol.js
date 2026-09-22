import { z } from "zod";

const base = {
  v: z.literal(1),
  sessionId: z.string().min(8),
  token: z.string().min(16),
  resumeSequence: z.number().int().nonnegative().optional(),
};
const turn = { ...base, turnId: z.number().int().positive() };
export const clientEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...turn,
      type: z.literal("input.start"),
      format: z.literal("pcm_s16le"),
      sampleRate: z.literal(16000),
      channels: z.literal(1),
    })
    .strict(),
  z
    .object({
      ...turn,
      type: z.literal("input.audio"),
      sequence: z.number().int().nonnegative(),
      data: z.string().max(90000),
    })
    .strict(),
  z.object({ ...turn, type: z.literal("input.end") }).strict(),
  z
    .object({
      ...turn,
      type: z.literal("input.text"),
      text: z.string().trim().min(1).max(500),
    })
    .strict(),
  z.object({ ...turn, type: z.literal("turn.cancel") }).strict(),
  z
    .object({
      ...turn,
      type: z.enum([
        "segment.started",
        "segment.finished",
        "segment.presented",
        "segment.retry",
      ]),
      segmentId: z.string().min(1).max(80),
      attemptId: z.string().min(1).max(80).optional(),
    })
    .strict(),
]);

export const performanceSchema = z
  .object({
    emotion: z.enum(["calm", "curious", "hesitant", "vulnerable"]),
    action: z.enum([
      "none",
      "look-window",
      "adjust-raincoat",
      "hold-camera",
      "show-photo",
      "farewell-nod",
    ]),
    event: z.enum(["none", "lightning", "photo-reveal"]),
    clue: z.string().max(60).nullable(),
  })
  .strict();

export const narrativeSchema = z
  .object({
    segments: z
      .array(
        z
          .object({
            text: z.string().trim().min(1).max(80),
            ...performanceSchema.shape,
          })
          .strict(),
      )
      .min(1)
      .max(3),
    nextBeat: z.string().min(1).max(60),
  })
  .strict();

export const directiveSchema = z.object({
  version: z.literal(1),
  character: z.object({
    emotion: z.enum(["calm", "curious", "hesitant", "vulnerable"]),
    expression: z.enum(["open-gaze", "averted-eyes", "soft-smile"]),
    pose: z.enum(["neutral", "attentive", "guarded", "softened"]),
    action: z.enum(["idle", "look-at-window", "adjust-raincoat", "hold-camera", "show-photo", "farewell-nod"]),
  }).strict(),
  cinematic: z.object({
    camera: z.enum(["steady", "slow-push-in"]),
    environment: z.enum(["rainy-cafe", "lightning-window", "warm-lamp-dim"]),
  }).strict(),
  effects: z.array(z.enum(["rain-reflection", "polaroid-glow", "lightning", "warm-lamp-dim"])).max(4),
  story: z.object({ nextBeat: z.string().min(1).max(60), clue: z.string().max(60).nullable(), endConversation: z.boolean(), endReason: z.enum(["user-departure"]).nullable() }).strict(),
  media: z.array(z.object({ type: z.enum(["image-reveal", "video"]), asset: z.enum(["polaroid-rainy-street", "mira-memory-clip"]) }).strict()).max(1),
}).strict();

export const parseClientEvent = (value) => clientEventSchema.safeParse(value);
