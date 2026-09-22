export class ConversationClient {
  constructor({ onEvent, onDisconnect } = {}) {
    this.onEvent = onEvent;
    this.onDisconnect = onDisconnect;
    this.queue = [];
    this.attempt = 0;
    this.maxAttempts = 5;
    this.closed = false;
    this.lastSequence = -1;
  }
  connect() {
    this.closed = false;
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    const query = this.sessionId && this.token ? `?sessionId=${encodeURIComponent(this.sessionId)}&token=${encodeURIComponent(this.token)}` : '';
    this.socket = new WebSocket(`${scheme}//${location.host}/api/conversation${query}`);
    this.socket.onopen = () => { this.attempt = 0; this.onEvent?.({ type: 'connection.state', state: 'connected' }); };
    this.socket.onmessage = ({ data }) => {
      const event = JSON.parse(data);
      if (Number.isInteger(event.eventSequence)) {
        if (event.eventSequence <= this.lastSequence) return;
        this.lastSequence = event.eventSequence;
      }
      if (event.type === "session.ready") {
        this.sessionId = event.sessionId;
        this.token = event.token;
        for (const queued of this.queue.splice(0)) this.send(queued);
      }
      this.onEvent?.(event);
    };
    this.socket.onclose = () => {
      if (this.closed) return;
      this.onEvent?.({ type: 'connection.state', state: 'reconnecting' });
      this.onDisconnect?.();
      if (this.attempt >= this.maxAttempts) { this.onEvent?.({ type: 'connection.state', state: 'failed' }); return; }
      const delay = Math.min(8000, 250 * (2 ** this.attempt++));
      window.setTimeout(() => { if (!this.closed) this.connect(); }, delay);
    };
    return this;
  }
  send(event) {
    if (!this.sessionId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.queue.push(event);
      return;
    }
    const message = {
      v: 1,
      sessionId: this.sessionId,
      token: this.token,
      ...event,
    };
    if (this.lastSequence >= 0) message.resumeSequence = this.lastSequence;
    if (this.socket.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify(message));
  }
  close() {
    this.closed = true;
    this.queue = [];
    this.socket?.close();
  }
}
