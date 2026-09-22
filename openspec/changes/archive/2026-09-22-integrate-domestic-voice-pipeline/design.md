# Design

具体接入报文、配置、浏览器协议与验收顺序见 [integration.md](./integration.md)。该文档是本设计的实施细则；当前仅完成方案，不代表真实模型已接通。

## Context

React currently starts MediaRecorder but discards its audio and submits fixed text. Express uses a shared client-supplied `mira-demo` session, deterministic story routes, and a no-op cancel endpoint. Browser SpeechSynthesis provides the reply voice. The existing scene protocol and persistent bottom drawer can be reused. This change adds provider-backed behavior; Mock remains the default.

## Goals / Non-Goals

Goals: actual Chinese speech input/output, coherent Mira role-play, turn-safe interruption, sentence-level audiovisual alignment, and measurable latency.

Non-goals: automatic VAD barge-in, voice cloning, word-level forced alignment, cross-provider failover, persistent accounts, or model hosting. The domestic-model requirement is interpreted as mainland cloud APIs, not private on-premise deployment.

## Decisions

### One mainland provider with replaceable adapters

Use Alibaba Cloud Model Studio Beijing: `paraformer-realtime-v2` for STT, `qwen-plus` with thinking disabled for LLM, and `cosyvoice-v3-flash` for TTS. Keep IDs configurable and validate model/voice availability in the selected workspace before live acceptance. Prefer one provider for billing and credentials; cross-vendor alternatives add integration work without improving the first acceptance path.

STT and TTS use server-owned WebSockets; LLM uses the provider's compatible Chat Completions HTTP API. Use documented workspace endpoints; do not infer them from frontend settings. Choose an officially supported Mandarin female system voice after listening to candidate samples; record the compatible voice ID in server configuration, never invent a cross-model voice ID. Tone target: restrained, warm, conversational. Emotion-driven scene motion does not imply unsupported voice-emotion controls.

### Audio capture and transport

Use getUserMedia plus AudioWorklet, convert the actual device sample rate to mono 16-bit 16 kHz PCM, and send approximately 100 ms frames over same-origin `/api/conversation` WebSocket. This avoids WebM/MP4 differences between browsers. On press, invalidate old playback immediately; on release, finish STT and wait for its final transcript. Buffer a bounded amount while upstream starts, then fail visibly if it cannot connect. Maximum utterance: 30 seconds. HTTPS is required outside localhost.

Server events: `session.ready`, `transcript.partial`, `transcript.final`, `response.segment`, `audio.chunk`, `audio.end`, `turn.error`, `turn.cancelled`. Client events: `input.start`, `input.audio`, `input.end`, `input.text`, `turn.cancel`, `segment.started`, `segment.finished`. Every turn event carries `sessionId`, `turnId`; media also carries `segmentId` and `sequence`. For MVP, base64 PCM in JSON envelopes is acceptable; bound frame size and queue length. Never put credentials in browser URLs or Vite variables.

### Bounded structured narrative generation

Send persona, current beat/intimacy/clues, a bounded history, and current transcript to Qwen. Request JSON Object output with `enable_thinking:false`, a short reply of 1-3 sentences, and per-sentence supported performance directives. Validate with a server schema and allowlists; do not execute provider strings as scripts, URLs, or arbitrary CSS. Story transitions must pass deterministic eligibility rules. Invalid JSON permits at most one repair request, then a visible recoverable error.

MVP waits for the complete short JSON before TTS, then synthesizes one sentence at a time. This deliberately favors valid scene instructions over token-level first-audio latency. Token-stream JSON parsing can be evaluated later. Text input enters at this same stage.

### Playback and cancellation

Request TTS PCM output (target 24 kHz where supported), and explicitly convey the actual format/sample rate to the browser. A bounded AudioContext queue schedules PCM chunks using its audio clock. Subtitle and cue changes follow actual segment start; an audio-end marker plus drained queue signals completion. Unlock audio during the user's gesture; if blocked, show an explicit play control. Retry only the failed speech segment, never replay an already heard segment automatically.

Use a server-issued anonymous session token bound to the socket, one active turn per session, abort controllers for HTTP, and provider task/socket cleanup for audio. Replace the shared session ID and no-op cancellation. A local generation counter protects microphone permission callbacks, pending audio decode, playback callbacks, and network events. Press-to-talk stops all queued/scheduled nodes locally before server acknowledgement. Close/pointer-cancel releases capture without submission; late microphone grants close their tracks.

Keep generated response and state changes provisional. Segment-start acknowledgement starts presentation only; commit the segment's disclosed clue and delivered assistant text only on a valid segment-finished acknowledgement. On cancellation discard unstarted segments and mark a started but unfinished segment interrupted, without treating its entire text as delivered. Explicit text-only presentation uses a separate segment.presented acknowledgement and records delivery as text. Future context must not claim an unheard or undisplayed disclosure. Disconnect closes active tasks; reconnect obtains a fresh session in this MVP, with a visible restart notice. Session TTL: 30 minutes idle; do not persist raw audio or transcripts in logs.

### Failure limits and measurements

Initial configurable deadlines: provider connect 5 s, ASR finalization after release 5 s, LLM response 12 s, TTS first chunk 8 s. No automatic full-turn retries after playback begins. TTS failure exposes text-only reply plus speech retry; STT failure offers recording retry/text input; microphone denial keeps the drawer usable. Enforce allowed origins, session-bound cancellation, text/audio size limits, per-session rate limits, and bounded provider concurrency before exposing the demo publicly.

Record timestamps and stage durations without audio/transcript contents. Performance targets to measure, not provider guarantees: release-to-first-audio P50 <= 3 s and P95 <= 6 s; local interruption audible-stop target <= 150 ms. Report results over at least 30 live turns on the documented device/network. Cost accounting separates recognized audio duration, LLM input/output tokens, and TTS billed text; use the selected region's actual rate card, without assuming a fixed per-conversation price.

### Configuration and code boundaries

Server `.env`: `VOICE_MODE=mock|aliyun`, `DASHSCOPE_API_KEY`, `DASHSCOPE_WS_URL`, `DASHSCOPE_LLM_BASE_URL`, `ASR_MODEL`, `LLM_MODEL`, `TTS_MODEL`, `TTS_VOICE`. Default to Mock even when a key exists. Live readiness validates required settings and exposes only nonsecret mode/availability information.

Split provider adapters under `server/providers/`, session coordination under `server/conversation/`, persona/schema under `server/narrative/`, and capture/player under `src/audio/`. Add `ws` and a schema validator such as `zod`; retain native fetch. Production uses one HTTPS origin with WebSocket proxying. A China-hosted deployment does not by itself establish all data-handling guarantees; verify provider/account terms separately if required.

## Risks / Trade-offs

- [Short JSON buffering adds latency] -> Cap response length and measure actual first-audio delay before adopting more complex streaming JSON.
- [Mobile permissions and autoplay vary] -> Test Android Chrome and iOS Safari on real devices, including rapid press/release and backgrounding.
- [Voice/model availability differs by region] -> Validate configuration in Beijing and use a supported system voice selected by audition.
- [Partial spoken content and narrative state can diverge] -> Commit only delivered segments and record interruption explicitly.
- [Mock tests cannot prove live integrations] -> Separate fake-provider contract tests from credentialed live acceptance; never mark live checks passed without evidence.

## Migration Plan

1. Introduce the common event/session contract and fake providers while retaining Mock behavior.
2. Implement the three adapters and schema validation; then capture and playback.
3. Verify cancellation races and UI recovery using delayed/failing fake providers.
4. Run configured live smoke and mobile latency checks, document results, then enable live mode explicitly. Roll back with `VOICE_MODE=mock` without changing the scene UI.

## References

- https://help.aliyun.com/zh/model-studio/websocket-for-paraformer-real-time-service
- https://help.aliyun.com/zh/model-studio/qwen-structured-output
- https://help.aliyun.com/zh/model-studio/realtime-tts-user-guide
- https://help.aliyun.com/zh/model-studio/tts-model
