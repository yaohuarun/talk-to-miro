const workletSource = `class PcmCapture extends AudioWorkletProcessor { process(inputs) { const channel = inputs[0]?.[0]; if (channel?.length) this.port.postMessage(channel.slice(0)); return true; } } registerProcessor('pcm-capture', PcmCapture);`;
export function downsampleToPcm16(input, inputRate, outputRate = 16000) {
  const ratio = inputRate / outputRate; const length = Math.floor(input.length / ratio); const output = new Int16Array(length);
  for (let index = 0; index < length; index += 1) { const start = Math.floor(index * ratio); const end = Math.max(start + 1, Math.floor((index + 1) * ratio)); let sum = 0; for (let cursor = start; cursor < end && cursor < input.length; cursor += 1) sum += input[cursor]; const value = Math.max(-1, Math.min(1, sum / (end - start))); output[index] = value < 0 ? value * 32768 : value * 32767; }
  return output;
}
export class PcmCapture {
  constructor(onFrame) { this.onFrame = onFrame; this.generation = 0; }
  async start() {
    const generation = ++this.generation; const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    if (generation !== this.generation) { stream.getTracks().forEach((track) => track.stop()); throw new DOMException('Cancelled', 'AbortError'); }
    const context = new AudioContext(); const url = URL.createObjectURL(new Blob([workletSource], { type: 'text/javascript' }));
    try { await context.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
    if (generation !== this.generation) { stream.getTracks().forEach((track) => track.stop()); await context.close(); throw new DOMException('Cancelled', 'AbortError'); }
    const source = context.createMediaStreamSource(stream); const node = new AudioWorkletNode(context, 'pcm-capture'); const sink = context.createGain(); sink.gain.value = 0;
    node.port.onmessage = ({ data }) => { if (generation === this.generation) this.onFrame(downsampleToPcm16(data, context.sampleRate)); };
    source.connect(node); node.connect(sink); sink.connect(context.destination); this.current = { stream, context, source, node, sink, generation }; return generation;
  }
  async stop() { this.generation += 1; const current = this.current; this.current = null; if (!current) return; current.node.port.onmessage = null; current.node.disconnect(); current.source.disconnect(); current.sink.disconnect(); current.stream.getTracks().forEach((track) => track.stop()); await current.context.close(); }
  cancel() { return this.stop(); }
}
