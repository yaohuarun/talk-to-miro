import "dotenv/config";

const integer = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

export function loadConfig(env = process.env) {
  const mode = env.VOICE_MODE === "aliyun" ? "aliyun" : "mock";
  const config = {
    mode,
    apiKey: env.DASHSCOPE_API_KEY || "",
    wsUrl:
      env.DASHSCOPE_WS_URL ||
      "wss://dashscope.aliyuncs.com/api-ws/v1/inference",
    llmBaseUrl:
      env.DASHSCOPE_LLM_BASE_URL ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
    asrModel: env.ASR_MODEL || "paraformer-realtime-v2",
    llmModel: env.LLM_MODEL || "qwen-plus",
    ttsModel: env.TTS_MODEL || "cosyvoice-v3-flash",
    ttsVoice: env.TTS_VOICE || "longanhuan",
    allowedOrigins: new Set(
      (env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
    connectTimeoutMs: integer(env.CONNECT_TIMEOUT_MS, 5000),
    asrFinalTimeoutMs: integer(env.ASR_FINAL_TIMEOUT_MS, 5000),
    llmTimeoutMs: integer(env.LLM_TIMEOUT_MS, 12000),
    ttsFirstChunkTimeoutMs: integer(env.TTS_FIRST_CHUNK_TIMEOUT_MS, 8000),
    ttsTotalTimeoutMs: integer(env.TTS_TOTAL_TIMEOUT_MS, 20000),
    sessionTtlMs: integer(env.SESSION_TTL_MS, 30 * 60 * 1000),
    maxConcurrentTurns: integer(env.MAX_CONCURRENT_TURNS, 4),
  };
  config.missing =
    mode === "aliyun"
      ? [
          "apiKey",
          "wsUrl",
          "llmBaseUrl",
          "asrModel",
          "llmModel",
          "ttsModel",
          "ttsVoice",
        ].filter((key) => !config[key])
      : [];
  config.ready = config.missing.length === 0;
  return config;
}

export function publicReadiness(config) {
  return {
    mode: config.mode,
    ready: config.ready,
    missing: config.missing,
    models:
      config.ready && config.mode === "aliyun"
        ? {
            asr: config.asrModel,
            llm: config.llmModel,
            tts: config.ttsModel,
            voice: config.ttsVoice,
          }
        : undefined,
  };
}
