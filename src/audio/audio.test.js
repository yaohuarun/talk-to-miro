import { afterEach, describe, expect, it, vi } from 'vitest';
import { downsampleToPcm16, PcmCapture } from './capture.js';
describe('PCM capture', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('resamples float device audio to 16 kHz signed PCM', () => { const source = new Float32Array(480).fill(0.5); const result = downsampleToPcm16(source, 48000); expect(result).toHaveLength(160); expect(result[0]).toBeGreaterThan(16000); });
  it('closes a late microphone grant after cancellation', async () => { let resolvePermission; const stop = vi.fn(); vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise((resolve) => { resolvePermission = resolve; }) } }); const capture = new PcmCapture(() => {}); const pending = capture.start(); await capture.cancel(); resolvePermission({ getTracks: () => [{ stop }] }); await expect(pending).rejects.toMatchObject({ name: 'AbortError' }); expect(stop).toHaveBeenCalledOnce(); });
  it('surfaces microphone denial without creating capture state', async () => { vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) } }); const capture = new PcmCapture(() => {}); await expect(capture.start()).rejects.toMatchObject({ name: 'NotAllowedError' }); expect(capture.current).toBeUndefined(); });
});
