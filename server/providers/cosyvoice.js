import { randomUUID } from "node:crypto";
import { connectTask } from "./ws-task.js";

export const ttsRunTask = (config, taskId) => ({
  header: { action: "run-task", task_id: taskId, streaming: "duplex" },
  payload: {
    task_group: "audio",
    task: "tts",
    function: "SpeechSynthesizer",
    model: config.ttsModel,
    parameters: {
      text_type: "PlainText",
      voice: config.ttsVoice,
      format: "pcm",
      sample_rate: 24000,
      volume: 50,
      rate: 1,
      pitch: 1,
    },
    input: {},
  },
});

export class CosyVoiceAdapter {
  constructor(config) {
    this.config = config;
  }
  async synthesize({ text, onAudio }) {
    const taskId = randomUUID();
    let started = false;
    let settled = false;
    let resolveDone;
    let rejectDone;
    const done = new Promise((resolve, reject) => {
      resolveDone = resolve;
      rejectDone = reject;
    });
    done.catch(() => {});
    const firstTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        clearTimeout(totalTimer);
        rejectDone(new Error("tts_first_chunk_timeout"));
        task.close();
      }
    }, this.config.ttsFirstChunkTimeoutMs);
    const totalTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        rejectDone(new Error("tts_total_timeout"));
        task.close();
      }
    }, this.config.ttsTotalTimeoutMs || 20000);
    const task = connectTask({
      url: this.config.wsUrl,
      apiKey: this.config.apiKey,
      timeoutMs: this.config.connectTimeoutMs,
      onBinary: (chunk) => {
        clearTimeout(firstTimer);
        onAudio(chunk);
      },
      onMessage: (event) => {
        const name = event.header?.event;
        if (name === "task-started" && !started) {
          started = true;
          task.sendJson({
            header: {
              action: "continue-task",
              task_id: taskId,
              streaming: "duplex",
            },
            payload: { input: { text } },
          });
          task.sendJson({
            header: {
              action: "finish-task",
              task_id: taskId,
              streaming: "duplex",
            },
            payload: { input: {} },
          });
        }
        if (name === "task-finished") {
          settled = true;
          clearTimeout(firstTimer);
          clearTimeout(totalTimer);
          resolveDone();
          task.close();
        }
        if (name === "task-failed" || name === "protocol-error") {
          settled = true;
          clearTimeout(firstTimer);
          clearTimeout(totalTimer);
          rejectDone(new Error(event.header?.error_message || "tts_failed"));
          task.close();
        }
      },
      onClose: () => {
        if (!settled) {
          settled = true;
          clearTimeout(firstTimer);
          clearTimeout(totalTimer);
          rejectDone(new Error("tts_disconnected"));
        }
      },
    });
    await task.opened;
    task.sendJson(ttsRunTask(this.config, taskId));
    return {
      done,
      cancel() {
        if (!settled) {
          settled = true;
          clearTimeout(firstTimer);
          clearTimeout(totalTimer);
          task.sendJson({
            header: {
              action: "finish-task",
              task_id: taskId,
              streaming: "duplex",
            },
            payload: { input: { directive: "cancel" } },
          });
          rejectDone(new Error("cancelled"));
          task.close();
        }
      },
    };
  }
}
