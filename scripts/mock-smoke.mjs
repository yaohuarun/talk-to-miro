import WebSocket from 'ws';
import { createMiraServer } from '../server/index.js';

const instance = createMiraServer({ env: { VOICE_MODE: 'mock', ALLOWED_ORIGINS: 'http://localhost:5173' } });
await new Promise((resolve) => instance.server.listen(0, '127.0.0.1', resolve));
const { port } = instance.server.address();
const socket = new WebSocket(`ws://127.0.0.1:${port}/api/conversation`, { headers: { Origin: 'http://localhost:5173' } });
let session;
const timeout = setTimeout(() => { console.error('Mock smoke timed out'); process.exitCode = 2; socket.terminate(); }, 5000);
socket.on('message', (raw) => {
  const event = JSON.parse(raw.toString()); console.log(event.type, event.mode || event.segmentId || event.code || '');
  if (event.type === 'session.ready') { session = event; socket.send(JSON.stringify({ v: 1, type: 'input.text', sessionId: event.sessionId, token: event.token, turnId: 1, text: '是的' })); }
  if (event.type === 'response.segment') socket.send(JSON.stringify({ v: 1, type: 'segment.presented', sessionId: session.sessionId, token: session.token, turnId: 1, segmentId: event.segmentId }));
  if (event.type === 'turn.completed') { clearTimeout(timeout); socket.close(); }
});
await new Promise((resolve, reject) => { socket.on('close', resolve); socket.on('error', reject); });
await instance.close();
