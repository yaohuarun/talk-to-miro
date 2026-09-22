# Proposal

## Why

The current voice path discards microphone audio and submits fixed text; replies use browser speech and the cancellation endpoint does no work. Mira needs a real, interruptible Chinese voice conversation while preserving credential-free evaluation.

## What Changes

- Add an explicit live mode using Alibaba Cloud mainland services: Paraformer STT, Qwen LLM, and CosyVoice TTS.
- Stream microphone audio to a server-owned provider connection, generate validated narrative replies, and play sentence-scoped audio with matching subtitles and performance events.
- Add session-isolated cancellation, bounded resource use, provider error recovery, and server-only configuration.
- Preserve default Mock mode and the persistent bottom input drawer.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `interruptible-character-conversation`: Add real provider-backed speech, live session isolation, synchronized audio segments, cancellation propagation, and explicit mode behavior.

## Impact

- React audio capture/playback and turn lifecycle; Express session coordinator and WebSocket gateway; provider adapters, schema validation, configuration, tests, and README.
- Adds server WebSocket support; retains existing scene performance vocabulary. Cloud usage is billable only in explicitly enabled live mode.
