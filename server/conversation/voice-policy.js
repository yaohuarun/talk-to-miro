const backchannels = new Set(['嗯', '嗯嗯', '嗯嗯嗯', '对', '对的', '好', '好的', '知道了', '明白了', '我听着', '继续']);
const stops = ['停一下', '等一下', '等等', '别说了', '先别说', '打断一下', '暂停'];
const normalize = (text = '') => text.replace(/[，。！？、,.!?\s]/g, '').trim();
export function classifyVoice(text, { stable = false } = {}) {
  const value = normalize(text);
  if (!value) return { kind: 'ambiguous', reason: 'empty' };
  if (stops.some((phrase) => value.includes(phrase))) return { kind: 'interrupt', reason: 'explicit-stop' };
  if (backchannels.has(value)) return { kind: 'backchannel', reason: 'acknowledgement' };
  if (!stable && value.length < 4) return { kind: 'ambiguous', reason: 'unstable-short' };
  return { kind: 'interrupt', reason: value.length >= 4 ? 'stable-content' : 'explicit-content' };
}
