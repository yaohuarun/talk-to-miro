const decodeBase64 = (data) => Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
export class PcmPlayer {
  constructor({ onStart, onFinish, onBlocked } = {}) { Object.assign(this, { onStart, onFinish, onBlocked }); this.segments = new Map(); this.sources = new Set(); this.generation = 0; this.playChain = Promise.resolve(); }
  async unlock() {
    try {
      if (!this.context || this.context.state === 'closed') this.context = new AudioContext();
      if (this.context.state !== 'running') await this.context.resume();
      const unlocked = this.context.state === 'running';
      if (!unlocked) this.onBlocked?.();
      return unlocked;
    } catch {
      this.onBlocked?.();
      return false;
    }
  }
  addChunk(event) { const key = `${event.segmentId}:${event.attemptId}`; const item = this.segments.get(key) || { meta: event, chunks: [] }; item.chunks[event.sequence] = decodeBase64(event.data); this.segments.set(key, item); }
  finish(event) { const generation = this.generation; this.playChain = this.playChain.catch(() => {}).then(() => generation === this.generation ? this.play(event, generation) : undefined); return this.playChain; }
  async play(event, generation) {
    const key = `${event.segmentId}:${event.attemptId}`; const item = this.segments.get(key); if (!item) throw new Error('audio_missing');
    if (!(await this.unlock())) throw new Error('audio_blocked'); if (generation !== this.generation) return; const bytes = item.chunks.reduce((sum, chunk) => sum + (chunk?.length || 0), 0); const even = bytes - (bytes % 2); const merged = new Uint8Array(even); let offset = 0;
    for (const chunk of item.chunks) { if (!chunk) throw new Error('audio_sequence_gap'); const length = Math.min(chunk.length, even - offset); merged.set(chunk.subarray(0, length), offset); offset += length; if (offset >= even) break; }
    const samples = new Int16Array(merged.buffer, merged.byteOffset, even / 2); const buffer = this.context.createBuffer(1, samples.length, item.meta.sampleRate); const target = buffer.getChannelData(0); for (let index = 0; index < samples.length; index += 1) target[index] = samples[index] / 32768;
    const source = this.context.createBufferSource(); source.buffer = buffer; source.connect(this.context.destination); this.sources.add(source); this.onStart?.(event); await new Promise((resolve) => { source.onended = () => { this.sources.delete(source); this.segments.delete(key); if (generation === this.generation) this.onFinish?.(event); resolve(); }; source.start(); });
  }
  cancel() { this.generation += 1; for (const source of this.sources) try { source.stop(); } catch {} this.sources.clear(); this.segments.clear(); this.playChain = Promise.resolve(); }
}
