# Design

## Context

See proposal.md for motivation. The current live path sends PCM frames to ASR, forwards partial transcripts to the client, and starts generation only after `input.end`; the client also has an explicit cancellation path for press-to-talk. The design must extend this lifecycle without weakening turn/session sequence gates or the existing sentence-level audio/subtitle coordination.

## Goals / Non-Goals

**Goals:**

- Make full-duplex voice interruption feel immediate while suppressing acknowledgement noise.
- Keep provisional ASR separate from committed conversation history and model turns.
- Prevent Mira playback from becoming microphone input through browser/device echo controls.
- Make streaming captions, first-audio latency, stage timings, reconnect, and recovery observable.
- Preserve explicit press-to-talk as a deterministic force-interrupt path and keep text as a fallback.

**Non-Goals:**

- Replacing the existing ASR, LLM, or TTS providers.
- Treating every detected voice segment as a conversation turn.
- Persisting raw microphone audio or telemetry containing transcript secrets.
- Adding wake-word activation or background microphone capture outside the active conversation session.

## Decisions

### 1. Two-stage interruption gate

Use a cheap client-side VAD to identify candidate speech and an authoritative server/client policy over ASR text to classify it as `backchannel`, `ambiguous`, or `interrupt`. The policy combines locale-aware acknowledgement phrases, explicit stop phrases, transcript stability, minimum semantic content, and a short confirmation window. Interim candidates can update captions but cannot cancel a turn. This is preferred over keyword-only matching because “嗯，等等” must become an interruption while “嗯” alone must not.

### 2. Explicit intent outranks automatic classification

Press-to-talk while Mira is speaking sends an explicit interrupt/capture signal and bypasses the classifier. Automatic interruption is used only for the continuous live capture path. This preserves current accessibility and deterministic behavior while adding natural hands-free overlap.

### 3. Event and state model

Extend the existing session event envelope with monotonic sequence numbers and phase/timing metadata. Add provisional transcript events, a classification result, acknowledgement suppression, and a confirmed-interrupt event. The client keeps provisional captions outside history; only a confirmed final transcript enters the normal `input.end`/turn pipeline. Every event is gated by session id, turn id, and generation so late events cannot revive cancelled playback.

### 4. Echo-safe capture and playback coordination

Request `echoCancellation`, `noiseSuppression`, and `autoGainControl` constraints, and expose the actual applied capability. Keep playback routing and capture lifecycle independent so cancellation closes tracks and stops processing immediately. If echo control is unavailable, default to explicit push-to-talk and show a degraded status instead of silently enabling unsafe automatic interruption.

### 5. Reconnect by acknowledged sequence

Reconnect the transport with bounded exponential backoff and a session resume token. The server acknowledges the last accepted sequence; the client resends only unacknowledged control/audio metadata and deduplicates replayed ASR or audio events. A cancelled, expired, or ownership-changed turn is never resumed. When resume is impossible, reset to idle with text fallback rather than replaying output.

### 6. Timing telemetry as bounded diagnostics

Record monotonic timestamps at capture start, first speech, ASR partial/final, classification, model request/first token, TTS request/first packet, playback start, reconnect, and recovery. Send aggregate stage durations to the client/debug surface with sampling and redaction; do not log raw audio, credentials, or full transcript by default.

## Risks / Trade-offs

- [False interruption from noisy speech or dialectal acknowledgements] → Use conservative defaults, explicit stop phrases, stability thresholds, user-visible classification state, and configurable locale vocabulary.
- [Echo cancellation differs across browsers/devices] → Inspect applied constraints, fall back to push-to-talk, and test with speaker playback plus headset scenarios.
- [Added buffering increases perceived interruption latency] → Allow explicit stop phrases to confirm on stable partials and keep the confirmation window short; measure first-audio and cancel latency separately.
- [Reconnect duplicates events or audio] → Require sequence/turn/generation gates and idempotent resume acknowledgements on both client and server.
- [Telemetry increases privacy or performance cost] → Keep metrics aggregate, sampled, bounded in memory, and disabled for raw media/transcript payloads.

## Migration Plan

1. Ship the classifier, event schema, and telemetry behind a live-voice feature flag; keep current press-to-talk as the default fallback.
2. Add echo-control capability detection and streaming caption rendering before enabling automatic interruption.
3. Enable automatic interruption for a small cohort, review false-positive/cancel-latency metrics, and tune acknowledgement/stop vocabularies.
4. Enable reconnect/resume after sequence and cancellation tests pass; rollback by disabling the flag, which restores explicit press-to-talk and existing final-transcript behavior.

## Open Questions

- Which locales beyond mainland Chinese should ship in the initial acknowledgement and explicit-stop vocabulary? This can remain configuration-only and does not change the contract.
