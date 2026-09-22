import { describe, expect, it } from "vitest";
import { TranscriptAssembler } from "./paraformer.js";
import { ttsRunTask } from "./cosyvoice.js";
describe("speech provider protocol fixtures", () => {
  it("replaces interim recognition and orders final sentences", () => {
    const partials = [];
    const transcript = new TranscriptAssembler((text) => partials.push(text));
    transcript.accept({ sentence_id: 1, text: "晚", sentence_end: false });
    transcript.accept({ sentence_id: 1, text: "晚上好", sentence_end: true });
    transcript.accept({ sentence_id: 0, text: "Mira，", sentence_end: true });
    expect(partials).toEqual(["晚"]);
    expect(transcript.text()).toBe("Mira，晚上好");
  });
  it("builds PCM 24k CosyVoice run-task with configured compatible voice", () => {
    const event = ttsRunTask(
      { ttsModel: "cosyvoice-v3-flash", ttsVoice: "longanhuan" },
      "task",
    );
    expect(event.payload.parameters).toMatchObject({
      format: "pcm",
      sample_rate: 24000,
      voice: "longanhuan",
    });
    expect(event.header.task_id).toBe("task");
  });
});

