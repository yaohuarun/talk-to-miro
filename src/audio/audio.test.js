import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downsampleToPcm16, PcmCapture, VoiceActivityDetector } from './capture.js';
describe('PCM capture', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', class {
      constructor() { this.state = 'running'; this.audioWorklet = { addModule: vi.fn().mockResolvedValue() }; }
      close() { return Promise.resolve(); }
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('resamples float device audio to 16 kHz signed PCM', () => { const source = new Float32Array(480).fill(0.5); const result = downsampleToPcm16(source, 48000); expect(result).toHaveLength(160); expect(result[0]).toBeGreaterThan(16000); });
  it('closes a late microphone grant after cancellation', async () => { let resolvePermission; const stop = vi.fn(); vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise((resolve) => { resolvePermission = resolve; }) } }); const capture = new PcmCapture(() => {}); const pending = capture.start(); await capture.cancel(); resolvePermission({ getTracks: () => [{ stop }] }); await expect(pending).rejects.toMatchObject({ name: 'AbortError' }); expect(stop).toHaveBeenCalledOnce(); });
  it('surfaces microphone denial without creating capture state', async () => { vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) } }); const capture = new PcmCapture(() => {}); await expect(capture.start()).rejects.toMatchObject({ name: 'NotAllowedError' }); expect(capture.current).toBeUndefined(); });
  it('resumes a suspended audio context before microphone permission settles', async () => { let resolvePermission; const resume = vi.fn().mockResolvedValue(); vi.stubGlobal('AudioContext', class { constructor() { this.state = 'suspended'; this.audioWorklet = { addModule: vi.fn().mockResolvedValue() }; } resume() { return resume(); } close() { return Promise.resolve(); } }); vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise((resolve) => { resolvePermission = resolve; }) } }); const capture = new PcmCapture(() => {}); const pending = capture.start(); expect(resume).toHaveBeenCalledOnce(); await capture.cancel(); resolvePermission({ getTracks: () => [{ stop() {} }] }); await expect(pending).rejects.toMatchObject({ name: 'AbortError' }); });
  it('detects speech only after loud frames and resets after silence', () => { const events = []; const detector = new VoiceActivityDetector({ threshold: 0.1, startFrames: 2, stopFrames: 2, onStart: () => events.push('start'), onStop: () => events.push('stop') }); detector.push(new Float32Array(8).fill(0.01)); detector.push(new Float32Array(8).fill(0.2)); detector.push(new Float32Array(8).fill(0.2)); detector.push(new Float32Array(8).fill(0)); detector.push(new Float32Array(8).fill(0)); expect(events).toEqual(['start', 'stop']); });
});
