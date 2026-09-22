# Proposal

## Why

Conversational products commonly reduce interaction to a scrolling message list, which cannot convey a character's presence, emotional performance, or story progression. This change introduces a mobile-first, playable scene with Mira so the team can validate an interruptible multimodal character experience without requiring private model credentials.

## What Changes

- Add a mobile-first single-scene experience set in a rain-soaked closing coffee shop, with Mira as the visual and narrative focus rather than a chat transcript.
- Add text and press-to-talk interaction across a continuous 3-5 minute, branching Mira conversation, with spoken replies and synchronized subtitles.
- Add an authoritative turn lifecycle that cancels speech, visual performance, media, and stale network responses when the user interrupts.
- Add a structured performance-directive contract that maps dialogue responses to emotions, expressions, actions, camera or environment changes, story branches, and media events.
- Add a local Mock mode that demonstrates the core dialogue, performance, interruption, error, and recovery paths without a private API key; define integration boundaries for a real STT/LLM/TTS or realtime voice provider.

## Capabilities

### New Capabilities
- `mira-interactive-scene`: Render and operate the responsive coffee-shop character scene, including visible character state, text and voice entry points, accessible feedback, and resilient media presentation.
- `interruptible-character-conversation`: Run continuous user turns and Mira replies with turn-scoped cancellation, press-to-talk interruption, synchronized audio/subtitles, and failure recovery.
- `narrative-performance-directives`: Produce and consume safe, structured scene instructions that drive Mira's emotional performance, branching narrative state, and dialogue-triggered visual events.

### Modified Capabilities

- None.

## Impact

- Adds a greenfield mobile web client, a session-oriented server API, local scene/audio/media assets, and automated tests for the interaction state machine.
- Adds browser media dependencies (`getUserMedia`, audio playback, video/image loading) with graceful unsupported-device and permission handling.
- Defines optional adapter interfaces for STT, dialogue, and TTS providers; Mock mode remains the default development and evaluation path.
