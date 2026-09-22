import { describe, expect, it } from 'vitest';
import { classifyVoice } from './voice-policy.js';
describe('voice interruption policy', () => {
  it.each(['嗯', '对', '好', '知道了'])('suppresses %s backchannels', (text) => expect(classifyVoice(text)).toMatchObject({ kind: 'backchannel' }));
  it.each(['停一下', '等等', '别说了'])('confirms %s stop phrases', (text) => expect(classifyVoice(text)).toMatchObject({ kind: 'interrupt' }));
  it('buffers ambiguous short input', () => expect(classifyVoice('啊')).toMatchObject({ kind: 'ambiguous' }));
  it('confirms stable short content', () => expect(classifyVoice('问你', { stable: true })).toMatchObject({ kind: 'interrupt' }));
});
