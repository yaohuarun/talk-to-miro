import { randomUUID } from "node:crypto";
import { connectTask } from "./ws-task.js";

export class TranscriptAssembler {
  constructor(onPartial) {
    this.onPartial = onPartial;
    this.sentences = new Map();
  }
  accept(sentence = {}) {
    if (!sentence.text) return;
    const key =
      sentence.sentence_id ?? sentence.begin_time ?? this.sentences.size;
    if (sentence.sentence_end) this.sentences.set(key, sentence.text);
    else this.onPartial?.(sentence.text);
  }
  text() {
    return [...this.sentences.entries()]
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, text]) => text)
      .join("")
      .trim();
  }
}

export class ParaformerAdapter {
  constructor(config) {
    this.config = config;
  }
  async start({ onPartial }) {
    const taskId = randomUUID();
    let started = false;
    let finished = false;
    let resolveFinal;
    let rejectFinal;
    const buffered = [];
    const transcript = new TranscriptAssembler(onPartial);
    const final = new Promise((resolve, reject) => {
      resolveFinal = resolve;
      rejectFinal = reject;
    });
    final.catch(() => {});
    const task = connectTask({
      url: this.config.wsUrl,
      apiKey: this.config.apiKey,
      timeoutMs: this.config.connectTimeoutMs,
      onMessage: (event) => {
        const name = event.header?.event;
        if (name === "task-started") {
          started = true;
          for (const chunk of buffered.splice(0)) task.socket.send(chunk);
        }
        transcript.accept(event.payload?.output?.sentence);
        if (name === "task-finished") {
          finished = true;
          resolveFinal(transcript.text());
          task.close();
        }
        if (name === "task-failed" || name === "protocol-error") {
          finished = true;
          rejectFinal(new Error(event.header?.error_message || "asr_failed"));
          task.close();
        }
      },
      onClose: () => {
        if (!finished) {
          finished = true;
          rejectFinal(new Error("asr_disconnected"));
        }
      },
    });
    await task.opened;
    task.sendJson({
      header: { action: "run-task", task_id: taskId, streaming: "duplex" },
      payload: {
        task_group: "audio",
        task: "asr",
        function: "recognition",
        model: this.config.asrModel,
        parameters: {
          format: "pcm",
          sample_rate: 16000,
          inverse_text_normalization_enabled: true,
        },
        input: {},
      },
    });
    return {
      send(chunk) {
        if (finished) throw new Error("asr_closed");
        if (started) task.socket.send(chunk);
        else {
          buffered.push(chunk);
          if (buffered.reduce((n, item) => n + item.length, 0) > 32000)
            throw new Error("asr_start_buffer_full");
        }
      },
      finish() {
        task.sendJson({
          header: {
            action: "finish-task",
            task_id: taskId,
            streaming: "duplex",
          },
          payload: { input: {} },
        });
        return final;
      },
      cancel() {
        if (!finished) {
          finished = true;
          rejectFinal(new Error("cancelled"));
          task.close();
        }
      },
    };
  }
}
