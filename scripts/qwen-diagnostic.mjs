import { loadConfig } from '../server/config.js';
import { QwenAdapter } from '../server/providers/qwen.js';
const adapter = new QwenAdapter(loadConfig());
const poisonedHistory = [{ role: 'assistant', content: '扇柄上还留着我的体温，别弄丢了' }];
for (const text of ['你在等谁？', '我喜欢拍雨夜的照片。', '谢谢你的咖啡。']) {
  const result = await adapter.generate({ text, story: { beat: 'opening', intimacy: 0, clues: [] }, history: poisonedHistory, signal: new AbortController().signal });
  console.log(JSON.stringify({ input: text, reply: result.segments.map((item) => item.text).join('') }, null, 2));
}
