# Tasks

## 1. Audio capture and classification foundation

- [x] 1.1 Add capability-aware microphone constraints for echo cancellation, noise suppression, and automatic gain control, with a unit test for supported and degraded browsers.
- [x] 1.2 Implement client-side voice-activity candidate detection and lifecycle cleanup; verify silence, noise, and playback-only input do not create candidates.
- [x] 1.3 Implement locale-aware backchannel/explicit-stop vocabulary and the stability/semantic threshold policy; verify “嗯”“对”“好” suppress and “停一下”“等等” confirm interruption.
- [x] 1.4 Add classifier reason/state events (`backchannel`, `ambiguous`, `interrupt`) and verify provisional input never enters conversation history.

## 2. Streaming protocol and server pipeline

- [x] 2.1 Extend the session event envelope with acknowledged sequence, generation, provisional transcript, classification, timing, and resume metadata; verify schema rejects stale or cross-session events.
- [x] 2.2 Update ASR streaming coordination so partials feed captions/classification while only confirmed final transcripts invoke model generation; verify empty and backchannel utterances create no turn.
- [x] 2.3 Add automatic-interruption cancellation in the conversation coordinator, preserving explicit press-to-talk as a force-interrupt path; verify queued audio, subtitles, directives, and media are cleared.
- [x] 2.4 Add aggregate stage timing instrumentation from capture through first playable audio packet; verify diagnostics contain latency fields but no credentials, raw audio, or unredacted transcript by default.

## 3. Client scene and caption experience

- [x] 3.1 Render streaming user captions with provisional/final styling and replacement semantics; verify a partial followed by final produces one caption rather than duplicates.
- [x] 3.2 Add non-blocking listening, suppressed-backchannel, interruption-confirmed, degraded-echo, reconnecting, and recovered scene states with accessible text; verify they do not obscure Mira's active subtitle.
- [x] 3.3 Display first-audio and key-stage timing feedback behind a diagnostics affordance; verify normal scene composition remains unchanged when diagnostics are hidden.

## 4. Reconnect and recovery

- [x] 4.1 Implement bounded exponential-backoff reconnect using session resume tokens and last acknowledged sequence; verify recovered sessions continue the same turn without replaying acknowledged events.
- [x] 4.2 Add deduplication and cancellation/expiry gates for replayed ASR, audio, subtitle, and directive events; verify cancelled turns never resume after reconnect.
- [x] 4.3 Provide recovery failure feedback, retry, and text-input fallback; verify microphone tracks and provider tasks are cleaned up after retry exhaustion.

## 5. Verification and rollout

- [x] 5.1 Add deterministic mock tests for backchannels, explicit stop phrases, ambiguous speech, echo-only input, and automatic interruption race conditions.
- [x] 5.2 Add live-mode integration coverage for streaming captions, first-packet latency, reconnect/resume, and cross-session isolation; verify existing text and press-to-talk tests remain green.
- [x] 5.3 Gate automatic interruption and telemetry behind a feature flag, document fallback behavior, and verify disabling the flag restores explicit press-to-talk flow.
