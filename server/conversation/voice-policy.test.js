import { describe, expect, it } from 'vitest';
import { classifyVoice } from './voice-policy.js';
describe('server voice policy', () => {
  it('does not interrupt on acknowledgements', () => expect(classifyVoice('嗯')).toMatchObject({ kind: 'backchannel' }));
  it('confirms explicit interruption', () => expect(classifyVoice('等等')).toMatchObject({ kind: 'interrupt', reason: 'explicit-stop' }));
});
