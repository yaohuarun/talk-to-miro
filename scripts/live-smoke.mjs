import { performance } from 'node:perf_hooks';
import { loadConfig } from '../server/config.js';
import { ParaformerAdapter } from '../server/providers/paraformer.js';
import { QwenAdapter } from '../server/providers/qwen.js';
import { CosyVoiceAdapter } from '../server/providers/cosyvoice.js';

const config = loadConfig();
if (config.mode !== 'aliyun' || !config.ready) throw new Error(`Live configuration is not ready: ${config.missing.join(',')}`);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const timings = {};

const qwen = new QwenAdapter(config);
let start = performance.now();
const reply = await qwen.generate({ text: '你好，外面的雨小一些了吗？', story: { beat: 'opening', clues: [], intimacy: 0 }, history: [], signal: new AbortController().signal });
timings.llmMs = Math.round(performance.now() - start);

const chunks = [];
const cosy = new CosyVoiceAdapter(config);
start = performance.now();
const speech = await cosy.synthesize({ text: reply.segments[0].text, onAudio: (chunk) => chunks.push(chunk) });
await speech.done;
timings.ttsMs = Math.round(performance.now() - start); timings.audioBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

const paraformer = new ParaformerAdapter(config); const partials = [];
start = performance.now();
const recognition = await paraformer.start({ onPartial: (text) => partials.push(text) });
const pcm = Buffer.concat(chunks);
for (let offset = 0; offset < pcm.length; offset += 3200) { recognition.send(pcm.subarray(offset, Math.min(offset + 3200, pcm.length))); await delay(100); }
const transcript = await recognition.finish();
timings.asrMs = Math.round(performance.now() - start); timings.partialCount = partials.length;

console.log(JSON.stringify({ ok: true, models: { asr: config.asrModel, llm: config.llmModel, tts: config.ttsModel, voice: config.ttsVoice }, timings, replySegments: reply.segments.length, transcriptLength: transcript.length }, null, 2));
