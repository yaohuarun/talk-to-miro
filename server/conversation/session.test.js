import { describe, expect, it } from 'vitest';
import { SessionRegistry } from './session.js';
describe('session recovery', () => {
  it('resumes a disconnected session with its token', () => { const registry = new SessionRegistry({ now: () => 1000 }); const first = registry.create({ readyState: 1 }); registry.disconnect(first); const resumed = registry.resume(first.id, first.token, { readyState: 1 }); expect(resumed).toBe(first); expect(resumed.socket.readyState).toBe(1); });
});
