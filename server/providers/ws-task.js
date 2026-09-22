import WebSocket from "ws";

export function connectTask({
  url,
  apiKey,
  timeoutMs = 5000,
  onMessage,
  onBinary,
  onClose,
}) {
  const socket = new WebSocket(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const opened = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("provider_connect_timeout"));
    }, timeoutMs);
    socket.once("open", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
  socket.on("message", (data, binary) => {
    if (binary) return onBinary?.(Buffer.from(data));
    try {
      onMessage?.(JSON.parse(data.toString()));
    } catch {
      onMessage?.({ header: { event: "protocol-error" } });
    }
  });
  socket.on("close", (code) => onClose?.(code));
  return {
    socket,
    opened,
    sendJson: (value) => socket.send(JSON.stringify(value)),
    close: () => socket.readyState < 2 && socket.close(),
  };
}
