import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { loadConfig, publicReadiness } from "./config.js";
import { parseClientEvent } from "./conversation/protocol.js";
import { SessionRegistry } from "./conversation/session.js";
import { ConversationCoordinator } from "./conversation/coordinator.js";
import { ParaformerAdapter } from "./providers/paraformer.js";
import { QwenAdapter } from "./providers/qwen.js";
import { CosyVoiceAdapter } from "./providers/cosyvoice.js";
import { createStorySession, selectStoryReply } from "./story.js";

export function createMiraServer({ env = process.env, providers = {} } = {}) {
  const config = loadConfig(env);
  const app = express();
  const server = createServer(app);
  const legacySessions = new Map();
  app.use(
    cors({
      origin: (origin, callback) =>
        callback(null, !origin || config.allowedOrigins.has(origin)),
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/readiness", (_req, res) => res.json(publicReadiness(config)));
  app.post("/api/turn", (req, res) => {
    const { sessionId = "legacy", turnId, text = "" } = req.body;
    const story = legacySessions.get(sessionId) || createStorySession();
    legacySessions.set(sessionId, story);
    const result = selectStoryReply(text, story);
    if (result.error)
      return res.status(504).json({ turnId, error: result.error });
    return res.json({
      turnId,
      reply: {
        text: result.text,
        audio: { kind: "browser-speech" },
        presentation: result.presentation,
      },
      performance: result.performance,
    });
  });
  app.post("/api/cancel", (_req, res) => res.status(204).end());
  const registry = new SessionRegistry({ ttlMs: config.sessionTtlMs });
  const coordinator = new ConversationCoordinator({
    config,
    registry,
    asr: providers.asr || new ParaformerAdapter(config),
    llm: providers.llm || new QwenAdapter(config),
    tts: providers.tts || new CosyVoiceAdapter(config),
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 65536 });
  server.on("upgrade", (request, socket, head) => {
    if (
      request.url !== "/api/conversation" ||
      (request.headers.origin &&
        !config.allowedOrigins.has(request.headers.origin))
    )
      return socket.destroy();
    wss.handleUpgrade(request, socket, head, (ws) =>
      wss.emit("connection", ws),
    );
  });
  wss.on("connection", (ws) => {
    const session = registry.create(ws);
    ws.send(
      JSON.stringify({
        v: 1,
        type: "session.ready",
        sessionId: session.id,
        token: session.token,
        ...publicReadiness(config),
      }),
    );
    ws.on("message", (raw, binary) => {
      if (binary) return ws.close(1003, "json_only");
      let value;
      try {
        value = JSON.parse(raw.toString());
      } catch {
        return ws.close(1007, "invalid_json");
      }
      const parsed = parseClientEvent(value);
      if (!parsed.success)
        return coordinator.send(session, {
          type: "turn.error",
          stage: "protocol",
          code: "invalid_event",
          retryable: false,
        });
      Promise.resolve(coordinator.handle(session, parsed.data)).catch(() => {});
    });
    ws.on("close", () => registry.remove(session));
  });
  const sweep = setInterval(
    () => registry.sweep(),
    Math.min(config.sessionTtlMs, 60000),
  );
  sweep.unref();
  return {
    app,
    server,
    config,
    registry,
    coordinator,
    close: () =>
      new Promise((resolve) => {
        clearInterval(sweep);
        wss.close(() => server.close(resolve));
      }),
  };
}
const direct =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (direct) {
  const instance = createMiraServer();
  instance.server.listen(4174, () =>
    console.log(`Mira API (${instance.config.mode}): http://localhost:4174`),
  );
}
