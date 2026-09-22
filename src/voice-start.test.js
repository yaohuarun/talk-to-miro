import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it, vi } from 'vitest';

it('starts capture with a scene performance state and sends audio before release', async () => {
  // Exercise the actual UI handler: capture-only tests cannot catch a local
  // React state variable shadowing the browser performance API.
  const source = readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
  const handler = source.slice(source.indexOf('  const startVoice ='), source.indexOf('  const endVoice ='));
  const send = vi.fn();
  const start = vi.fn().mockResolvedValue();
  const scope = {
    ended: false, performance: { emotion: 'calm' },
    window: { performance: { now: () => 123 } },
    active: { current: 1 }, sequence: { current: 0 },
    player: { current: { unlock: () => Promise.resolve(true) } },
    client: { current: { send } }, capture: {}, voiceSession: {}, vad: {}, speechStarted: {},
    cancel() {}, setRecording() {}, setNotice() {}, setVoiceStatus() {},
    setPhase() {}, setInputMode() {}, setDrawerOpen() {},
    encodePcm: () => 'AQI=',
    VoiceActivityDetector: class { push() {} },
    PcmCapture: class { constructor(onFrame) { this.onFrame = onFrame; } start = start; },
  };
  await vm.runInNewContext(`${handler}\nstartVoice();`, scope);
  expect(start).toHaveBeenCalledOnce();
  expect(scope.speechStarted.current).toBe(123);
  scope.capture.current.onFrame(new Int16Array([1]), {});
  expect(send.mock.calls.map(([event]) => event.type)).toEqual(['input.start', 'input.audio']);
});
