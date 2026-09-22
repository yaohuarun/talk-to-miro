# Tasks

## 1. Contracts and configuration

- [x] 1.1 Define validated session/turn/segment event schemas and fake-provider fixtures; verify malformed and stale events are rejected by contract tests.
- [x] 1.2 Add server-only live configuration, nonsecret readiness, and default Mock mode; verify missing live settings fail visibly and Mock makes no provider requests.
- [x] 1.3 Implement isolated session tokens, task ownership, deadlines, TTL, origin checks, and bounded queues; verify cross-session cancellation and oversized input are rejected.

## 2. Provider adapters

- [x] 2.1 Implement Paraformer WebSocket lifecycle, PCM frames, final transcript aggregation, and empty-speech handling; verify partial/final/error/timeout cases with recorded protocol fixtures.
- [x] 2.2 Implement Qwen persona/history prompts and JSON output validation with bounded repair and eligible state transitions; verify acknowledgements, clue gating, and malformed directives.
- [x] 2.3 Implement CosyVoice sentence synthesis, format metadata, first-chunk timeout, and cleanup; verify ordered audio and failure behavior using fake upstream streams.
- [x] 2.4 Coordinate provisional narrative state and delivered-segment acknowledgements; verify interruptions cannot commit unplayed clues or assistant text.

## 3. Browser audio and persistent drawer

- [x] 3.1 Add AudioWorklet capture, resampling, bounded frames, and capture generation guards; verify rapid release, permission denial, late grant, and pointer cancellation release all tracks.
- [x] 3.2 Add PCM playback scheduling and audio unlock controls; verify correct sample rate, segment-start subtitle/cue timing, and queue drain completion.
- [x] 3.3 Connect text and voice inputs to the shared live event stream while keeping the bottom drawer persistent; verify both modes work without altering drawer-dismissal behavior.
- [x] 3.4 Cancel scheduled audio, subtitle/action/media queues, upstream tasks, and late callbacks; verify interruption at STT, LLM, TTS, playback, and reconnect stages with delayed fake providers.
- [x] 3.5 Add text fallback and explicit speech-segment retry; verify TTS retry does not call the LLM again or replay already completed segments.

## 4. Verification and handoff

- [x] 4.1 Update UTF-8 README and example environment configuration with Beijing setup, compatible model/voice selection, HTTPS/WebSocket deployment, mode selection, and usage accounting; verify no secrets appear in the frontend build.
- [x] 4.2 Run automated pipeline tests, production build, and credential-free Mock acceptance; record actual results separately from live checks.
- [ ] 4.3 With configured credentials, audition supported female system voices and select a valid voice ID; run actual STT/LLM/TTS exchanges and at least 30 latency samples, recording P50/P95 and interruption latency rather than assuming targets are met. (Live models and 30 latency samples passed; pending human voice audition and real audible-stop measurement.)
- [ ] 4.4 Verify Android Chrome and iOS Safari capture, playback, interruption, keyboard, fullscreen, and background recovery on real devices; record devices/results and keep this task pending if device access is unavailable.
