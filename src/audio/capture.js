const workletSource = `class PcmCapture extends AudioWorkletProcessor { process(inputs) { const channel = inputs[0]?.[0]; if (channel?.length) this.port.postMessage(channel.slice(0)); return true; } } registerProcessor('pcm-capture', PcmCapture);`;
export function downsampleToPcm16(input, inputRate, outputRate = 16000) {
  const ratio = inputRate / outputRate; const length = Math.floor(input.length / ratio); const output = new Int16Array(length);
  for (let index = 0; index < length; index += 1) { const start = Math.floor(index * ratio); const end = Math.max(start + 1, Math.floor((index + 1) * ratio)); let sum = 0; for (let cursor = start; cursor < end && cursor < input.length; cursor += 1) sum += input[cursor]; const value = Math.max(-1, Math.min(1, sum / (end - start))); output[index] = value < 0 ? value * 32768 : value * 32767; }
  return output;
}
export const captureConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
export function frameRms(frame) {
  if (!frame?.length) return 0;
  let sum = 0;
  for (const sample of frame) sum += sample * sample;
  return Math.sqrt(sum / frame.length);
}
export class VoiceActivityDetector {
  constructor({ threshold = 0.018, startFrames = 2, stopFrames = 5, onStart, onStop } = {}) {
    Object.assign(this, { threshold, startFrames, stopFrames, onStart, onStop });
    this.active = false; this.loud = 0; this.quiet = 0;
  }
  push(frame) {
    const speaking = frameRms(frame) >= this.threshold;
    if (speaking) { this.loud += 1; this.quiet = 0; }
    else { this.quiet += 1; this.loud = 0; }
    if (!this.active && this.loud >= this.startFrames) { this.active = true; this.onStart?.(); }
    if (this.active && this.quiet >= this.stopFrames) { this.active = false; this.onStop?.(); }
    return this.active;
  }
  reset() { if (this.active) this.onStop?.(); this.active = false; this.loud = 0; this.quiet = 0; }
}
export class PcmCapture {
  constructor(onFrame) { this.onFrame = onFrame; this.generation = 0; }
  async start() {
    const generation = ++this.generation;
    // AudioContext must be resumed while pointerdown still owns a transient
    // user activation. Doing this after awaiting microphone permission leaves
    // some browsers suspended until pointerup, which is already too late for
    // a push-to-talk session.
    const context = new AudioContext();
    const resumePromise = context.state === 'suspended' ? context.resume() : Promise.resolve();
    const url = URL.createObjectURL(new Blob([workletSource], { type: 'text/javascript' }));
    const modulePromise = context.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url));
    let stream;
    try {
      [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: captureConstraints }),
        modulePromise,
        resumePromise,
      ]);
    } catch (error) {
      await context.close().catch(() => {});
      throw error;
    }
    if (generation !== this.generation) { stream.getTracks().forEach((track) => track.stop()); await context.close(); throw new DOMException('Cancelled', 'AbortError'); }
    const source = context.createMediaStreamSource(stream); const node = new AudioWorkletNode(context, 'pcm-capture'); const sink = context.createGain(); sink.gain.value = 0;
    const settings = stream.getAudioTracks?.()[0]?.getSettings?.() || {};
    node.port.onmessage = ({ data }) => { if (generation === this.generation) this.onFrame(downsampleToPcm16(data, context.sampleRate), settings); };
    source.connect(node); node.connect(sink); sink.connect(context.destination); this.current = { stream, context, source, node, sink, generation }; return generation;
  }
  async stop() { this.generation += 1; const current = this.current; this.current = null; if (!current) return; current.node.port.onmessage = null; current.node.disconnect(); current.source.disconnect(); current.sink.disconnect(); current.stream.getTracks().forEach((track) => track.stop()); await current.context.close(); }
  cancel() { return this.stop(); }
}
