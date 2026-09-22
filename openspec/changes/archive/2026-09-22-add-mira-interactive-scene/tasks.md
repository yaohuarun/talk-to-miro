# Tasks

## 1. Application foundation and contracts

- [x] 1.1 Scaffold the mobile web client and session API with documented local start commands, and verify a fresh checkout starts in Mock mode without provider credentials
- [x] 1.2 Define and validate the versioned turn response and performance-directive schemas, and verify unknown directive values are rejected or ignored without crashing the scene
- [x] 1.3 Implement the session state machine and monotonically increasing turn-ID guard, and verify unit tests cover idle, listening, thinking, speaking, error, cancellation, and stale-event rejection
- [x] 1.4 Add server-side session lifecycle, cancellation propagation, timeout handling, and a provider-adapter interface, and verify delayed or cancelled responses cannot be emitted as the active turn

## 2. Mira scene and media presentation

- [x] 2.1 Build the responsive coffee-shop scene layout with Mira, subtitles, text entry, and press-to-talk controls, and verify narrow mobile and desktop viewport screenshots have no horizontal scrolling or chat-list primary UI
- [x] 2.2 Implement visibly distinct idle, listening, thinking, and speaking presentation states plus at least three emotions and two non-speaking actions, and verify them through renderer state tests or a documented manual state gallery
- [x] 2.3 Add accessible live status, microphone permission feedback, and text fallback behavior, and verify keyboard and denied-permission flows preserve text interaction
- [x] 2.4 Add turn-scoped image/video media loading, completion, error, and cancellation handling, and verify an interrupted or failed event leaves the scene stable and conversational

## 3. Conversation and interruption loop

- [x] 3.1 Implement continuous text submissions with session context and Mock dialogue responses, and verify multiple turns progress without resetting Mira or the story
- [x] 3.2 Implement press-to-talk capture lifecycle with release-to-submit behavior, and verify press starts listening, release submits an utterance, and unsupported capture reports a recoverable error
- [x] 3.3 Implement synchronized reply audio and subtitle playback behind an audio adapter, and verify Mock mode presents a reply even when browser speech output is unavailable
- [x] 3.4 Implement interruption cleanup for active audio, subtitles, queued directives, and media, and verify an automated delayed-response test proves an interrupted reply never resumes or overwrites the next turn

## 4. Narrative performance and Mock experience

- [x] 4.1 Author deterministic Mira story beats for opening, rapport, guarded inquiry, disclosure, and resolution, and verify a representative 3-5 minute path reaches a coherent ending
- [x] 4.2 Map dialogue intents about rain, photography, the camera, and waiting to turn-scoped performance directives, and verify the photo reveal is triggered by eligible dialogue rather than elapsed time
- [x] 4.3 Implement the directed lighting/camera or background shift and local multimodal disclosure event, and verify it plays only for its active response and stops on interruption
- [x] 4.4 Add Mock failure and recovery fixtures for timeout, disconnect, audio error, and media error, and verify each returns the user to a usable subsequent turn

## 5. Verification and handoff

- [x] 5.1 Add unit and integration coverage for directive validation, state transitions, interruption races, and Mock story branches, and verify the full test suite passes
- [x] 5.2 Perform mobile and desktop manual acceptance checks for all spec scenarios, and record the tested browsers, microphone fallback result, media fallback result, and rapid-interruption result
- [x] 5.3 Write the README with local setup, Mock-mode walkthrough, real-provider configuration boundary, press-to-talk rationale, interruption semantics, and known browser limitations, and verify a reviewer can run the core flow without a private key
