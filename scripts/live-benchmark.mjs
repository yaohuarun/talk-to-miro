import { performance } from 'node:perf_hooks';
import { loadConfig } from '../server/config.js';
import { ParaformerAdapter } from '../server/providers/paraformer.js';
import { QwenAdapter } from '../server/providers/qwen.js';
import { CosyVoiceAdapter } from '../server/providers/cosyvoice.js';

const config = loadConfig();
if (config.mode !== 'aliyun' || !config.ready) throw new Error('Live configuration is not ready');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cosy = new CosyVoiceAdapter(config); const sourceChunks = [];
const source = await cosy.synthesize({ text: '外面的雨小一些了吗？', onAudio: (chunk) => sourceChunks.push(chunk) }); await source.done;
const sourcePcm = Buffer.concat(sourceChunks); const samples = []; const failures = [];
const prompts = ['外面的雨小一些了吗？', '你还在等那个人吗？', '可以看看你的照片吗？'];

async function one(index) {
  const asr = new ParaformerAdapter(config); const recognition = await asr.start({}); await delay(300);
  for (let offset = 0; offset < sourcePcm.length; offset += 3200) { recognition.send(sourcePcm.subarray(offset, Math.min(offset + 3200, sourcePcm.length))); await delay(8); }
  const releasedAt = performance.now(); const transcript = await recognition.finish(); const asrFinalAt = performance.now();
  const reply = await new QwenAdapter(config).generate({ text: transcript || prompts[index % prompts.length], story: { beat: 'guarded-inquiry', clues: ['camera'], intimacy: 2 }, history: [], signal: new AbortController().signal }); const llmAt = performance.now();
  let firstResolve; const first = new Promise((resolve) => { firstResolve = resolve; }); let firstSeen = false;
  const speech = await new CosyVoiceAdapter(config).synthesize({ text: reply.segments[0].text, onAudio: () => { if (!firstSeen) { firstSeen = true; firstResolve(performance.now()); } } });
  const firstAt = await Promise.race([first, delay(12000).then(() => { throw new Error('first_audio_timeout'); })]); speech.cancel();
  return { index: index + 1, releaseToFirstAudioMs: Math.round(firstAt - releasedAt), asrFinalMs: Math.round(asrFinalAt - releasedAt), llmMs: Math.round(llmAt - asrFinalAt), ttsFirstMs: Math.round(firstAt - llmAt) };
}

for (let batch = 0; samples.length < 30 && batch < 20; batch += 1) { const values = await Promise.allSettled([0, 1, 2].map((slot) => one(batch * 3 + slot))); for (const value of values) { if (value.status === 'fulfilled') samples.push(value.value); else failures.push(value.reason?.message || String(value.reason)); } console.error(`completed ${samples.length}/30, failures ${failures.length}`); }
if (samples.length < 30) throw new Error(`Only ${samples.length} successful samples after ${samples.length + failures.length} attempts`);
const percentile = (values, p) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.ceil(p * sorted.length) - 1]; };
const release = samples.map((item) => item.releaseToFirstAudioMs);
console.log(JSON.stringify({ testedAt: new Date().toISOString(), count: samples.length, attempted: samples.length + failures.length, failures: failures.reduce((summary, code) => ({ ...summary, [code]: (summary[code] || 0) + 1 }), {}), models: { asr: config.asrModel, llm: config.llmModel, tts: config.ttsModel, voice: config.ttsVoice }, releaseToFirstAudio: { p50Ms: percentile(release, .5), p95Ms: percentile(release, .95), minMs: Math.min(...release), maxMs: Math.max(...release) }, stages: { asrFinalP50Ms: percentile(samples.map((item) => item.asrFinalMs), .5), llmP50Ms: percentile(samples.map((item) => item.llmMs), .5), ttsFirstP50Ms: percentile(samples.map((item) => item.ttsFirstMs), .5) }, samples }, null, 2));
