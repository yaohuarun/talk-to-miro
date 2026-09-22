# Design

## Context

This is a greenfield repository with no application source, existing capabilities, or product runtime to preserve. See `proposal.md` for motivation and the three delta specifications for observable behavior. The MVP must run without private credentials while retaining a credible integration boundary for real-time voice services.

## Goals / Non-Goals

**Goals:**

- Establish a mobile web scene renderer where presentation state is explicitly modeled rather than inferred from a chat UI.
- Make cancellation authoritative across browser media, visual directives, asynchronous requests, and server response generation.
- Keep scripted Mock mode and provider-backed mode behind the same session contract.
- Favor locally shippable scene assets and behavior that are testable deterministically.

**Non-Goals:**

- Production-grade content safety, account systems, analytics, persistence across devices, or multi-character support.
- Automatic voice activity detection; the MVP deliberately uses press-to-talk.
- Live2D rigging, generated images/video, or unrestricted generative storytelling.
- Guaranteeing speech-recognition availability in every browser.

## Decisions

### 1. Separate scene presentation from conversation orchestration

The client will use one session controller with explicit `idle`, `listening`, `thinking`, `speaking`, and `error` states. A scene renderer consumes its state plus turn-scoped directives; it does not interpret raw model text. This keeps visual behavior consistent and lets tests assert state changes without browser playback.

Alternative considered: have individual UI components respond directly to streamed model output. Rejected because cancellation and stale-event handling would be distributed and error-prone.

### 2. Use monotonically increasing turn IDs as the cancellation boundary

Submitting or recording a turn creates a new `turnId`. The browser retains an abort handle and active media handles for that ID. On interruption it aborts the request, stops audio/video, clears scheduled subtitle and directive work, increments the active turn, and sends cancellation to the server. The server carries the ID through STT, dialogue, and TTS; an output is emitted only if it is still active. The client independently drops every event whose turn ID differs from its current one.

Alternative considered: rely solely on request abort. Rejected because provider cancellation can be delayed and browser media or buffered events can still execute.

### 3. Use press-to-talk for the MVP voice interaction

Press-and-hold recording provides an unambiguous start/end gesture and doubles as a reliable interruption command in noisy mobile environments. It avoids false VAD triggers caused by the coffee-shop audio aesthetic and removes a browser-specific VAD dependency. The README will document this rationale and text fallback behavior.

Alternative considered: automatic VAD. Deferred until production usage data validates it across devices and acoustic conditions.

### 4. Define a versioned performance directive allowlist

The server returns a response envelope containing `turnId`, reply text, audio payload or stream reference, and a versioned directive. Directive values are constrained to an allowlist: emotion, expression, pose, action, camera/environment, effects, branch flags, and local media IDs. The client validates fields before rendering. Unknown values are ignored and reported diagnostically, so a provider cannot request arbitrary assets or code paths.

Example envelope:

```json
{
  "turnId": 7,
  "reply": { "text": "...", "audio": { "kind": "stream" } },
  "performance": {
    "emotion": "vulnerable",
    "expression": "soft-smile",
    "action": "hold-camera",
    "camera": "slow-push-in",
    "effects": ["rain-reflection"],
    "media": [{ "type": "image-reveal", "asset": "polaroid-rainy-street" }],
    "storyFlags": ["waiting-person-revealed"]
  }
}
```

Alternative considered: natural-language action instructions. Rejected because they are difficult to validate, test, and cancel safely.

### 5. Build local layered character states plus an interruptible cinematic asset

The scene uses local visual layers and CSS/SVG state animation for Mira's idle, listening, thinking, speaking, expressions, and actions. A small local WebM or equivalent cinematic event supplies the required multimodal presentation for the lightning/disclosure beat. The media controller reports loading, completion, error, and cancellation, and always verifies the source turn before presenting a result.

Alternative considered: Live2D. Deferred because it introduces art-production and runtime complexity before the interaction loop is proven.

### 6. Make story progression explicit and deterministic in Mock mode

A story state machine tracks opening, rapport, guarded inquiry, disclosure, and resolution, alongside one-time event flags. Keyword/intention matching in Mock mode selects responses and directives, ensuring photo reveal and environment change are conversation-triggered rather than timer-triggered. A production adapter can replace this selector with STT + LLM + TTS or a realtime provider while retaining the envelope and turn lifecycle.

## Risks / Trade-offs

- [Browser microphone policies differ and permissions may be denied] -> retain text input, expose clear permission feedback, and keep voice capture adapter-isolated.
- [TTS latency weakens conversational presence] -> transition to thinking immediately, support streamed/provider audio later, and preserve cancellation at every stage.
- [A short cinematic asset delays loading] -> preload a small local asset, show loading status, and gracefully fall back to the static scene.
- [Keyword Mock routing feels constrained] -> use it only as the credential-free demonstration; preserve provider adapters for richer dialogue.
- [Fast repeated input creates races] -> test turn-ID guards with delayed responses and assert no invalidated output reaches the renderer.
- [Visual layers can feel less rich than a rigged avatar] -> prioritize recognizable states and timing in MVP; defer richer animation assets until usability is validated.

## Migration Plan

1. Ship Mock mode as the default path and verify it on mobile and desktop browsers.
2. Add provider credentials only on the server and enable the real provider adapter behind configuration.
3. Monitor cancellation, media failure, and permission events before expanding voice automation.
4. Roll back by switching to Mock mode; no user data migration is required for this greenfield MVP.

## Open Questions

- Which speech provider, voice identity, and retention policy will be approved for a production deployment?
- Whether the initial cinematic beat should ship as licensed recorded footage or a commissioned illustration sequence.
