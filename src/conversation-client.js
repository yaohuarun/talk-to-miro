export class ConversationClient {
  constructor({ onEvent, onDisconnect } = {}) {
    this.onEvent = onEvent;
    this.onDisconnect = onDisconnect;
    this.queue = [];
  }
  connect() {
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    this.socket = new WebSocket(`${scheme}//${location.host}/api/conversation`);
    this.socket.onmessage = ({ data }) => {
      const event = JSON.parse(data);
      if (event.type === "session.ready") {
        this.sessionId = event.sessionId;
        this.token = event.token;
        for (const queued of this.queue.splice(0)) this.send(queued);
      }
      this.onEvent?.(event);
    };
    this.socket.onclose = () => this.onDisconnect?.();
    return this;
  }
  send(event) {
    if (!this.sessionId) {
      this.queue.push(event);
      return;
    }
    const message = {
      v: 1,
      sessionId: this.sessionId,
      token: this.token,
      ...event,
    };
    if (this.socket.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify(message));
  }
  close() {
    this.queue = [];
    this.socket?.close();
  }
}
