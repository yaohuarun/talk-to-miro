# Spec Delta

## MODIFIED Requirements

### Requirement: User interruption supersedes active output
The system SHALL treat a new press-to-talk interaction, new user submission, or a confirmed substantive utterance detected by the real-time voice path during a reply as an interruption. It MUST immediately stop active reply audio, invalidate unfinished response content, clear queued subtitle, action, and media events, enter listening or processing state for the new input, and prevent superseded response data from resuming. Short backchannels such as “嗯”, “嗯嗯”, “对”, “好” and equivalent locale-aware acknowledgements MUST NOT interrupt an active reply or create a model turn. Explicit press-to-talk remains an authoritative user interruption signal and bypasses backchannel filtering.

#### Scenario: User interrupts Mira while she is speaking
- **WHEN** the user opens the drawer and begins press-to-talk while Mira's reply audio is playing
- **THEN** the audio stops immediately and no remaining subtitles, actions, or media from that reply are presented

#### Scenario: User submits text while Mira is speaking
- **WHEN** the user opens the drawer and submits a new text turn while Mira's reply is active
- **THEN** the active reply is invalidated and the new text turn becomes the only active response request

#### Scenario: User speaks a substantive utterance during playback
- **WHEN** real-time voice detection observes a stable utterance with content beyond an acknowledgement while Mira is speaking
- **THEN** the active reply is invalidated, queued output is cleared, and the confirmed utterance becomes the only active response request

#### Scenario: User gives a backchannel during playback
- **WHEN** recognition yields “嗯”, “对”, “好”, “知道了” or another configured short acknowledgement without an explicit stop intent
- **THEN** Mira's audio, subtitle, and scene event continue and no model turn or conversation-history entry is created

#### Scenario: Superseded response arrives late
- **WHEN** a cancelled turn later returns text, audio, or performance data
- **THEN** the late data does not alter the current character state or start output

### Requirement: Live domestic speech pipeline
In explicitly enabled live mode, the system SHALL transcribe actual microphone audio using a mainland Chinese provider, pass only a confirmed user utterance to a language model, and synthesize the validated response with provider TTS. The pipeline MUST expose interim ASR text for captions without starting generation. While Mira is speaking, voice activity and interim text MUST be classified as backchannel, ambiguous, or interruption; only a confirmed interruption is submitted. Empty audio, noise-only input, and unconfirmed backchannels MUST NOT generate a fabricated user utterance.

#### Scenario: Real voice exchange
- **WHEN** the user holds the voice control, speaks, and releases it
- **THEN** the finalized transcript drives the response and synthesized speech reflects that response

#### Scenario: Automatic interruption
- **WHEN** the user starts speaking over Mira and the utterance passes the interruption confirmation policy
- **THEN** the system cancels the current output and submits the confirmed transcript without requiring a second press

#### Scenario: Empty utterance or backchannel
- **WHEN** recognition completes without speech or with only a configured acknowledgement
- **THEN** no model turn is generated and Mira's current output remains uninterrupted

#### Scenario: Empty utterance
- **WHEN** recognition completes without speech
- **THEN** no model turn is generated and the user can retry or type

## ADDED Requirements

### Requirement: Real-time interruption classification
The system SHALL classify live microphone input using voice activity, interim/final transcript stability, explicit interruption phrases, acknowledgement vocabulary, and configurable duration/content thresholds. The classifier MUST prefer no interruption for ambiguous short input and MUST expose the classification reason for diagnostics.

#### Scenario: Explicit stop phrase
- **WHEN** the user says “停一下”, “等一下”, “别说了” or an equivalent configured phrase
- **THEN** the input is confirmed as an interruption as soon as it is reliably recognized

#### Scenario: Ambiguous short input
- **WHEN** a short utterance is neither a known backchannel nor an explicit stop phrase and has not reached stability thresholds
- **THEN** the system buffers it without cancelling playback and waits for more audio or a stable final result

### Requirement: Echo-safe microphone capture
The system SHALL request and use browser audio constraints for echo cancellation, noise suppression, and automatic gain control when supported. It MUST avoid feeding Mira's own playback back into recognition and MUST report when constraints are unavailable or degraded.

#### Scenario: Browser supports acoustic echo cancellation
- **WHEN** the microphone is opened while Mira is speaking
- **THEN** capture uses echo cancellation and related supported constraints, and recognition does not classify normal Mira playback as user speech

#### Scenario: Echo control unavailable
- **WHEN** the browser or device cannot provide echo cancellation
- **THEN** the user sees a non-blocking degraded-audio status and can continue with explicit press-to-talk or text input

### Requirement: Streaming speech captions and latency telemetry
The system SHALL display interim user captions while speech is being recognized, replace them with the final transcript when confirmed, and keep Mira's response subtitles synchronized with playback. It SHALL expose first-audio-packet latency and stage timings for capture, ASR, classification, LLM, TTS, playback start, reconnect, and recovery without exposing credentials.

#### Scenario: Interim transcript arrives
- **WHEN** ASR emits a partial transcript during an active capture
- **THEN** the caption updates incrementally and is visibly marked as provisional without starting generation

#### Scenario: First audio packet timing
- **WHEN** Mira's response begins playback
- **THEN** the UI or diagnostics state reports elapsed time from accepted input to first playable audio packet

### Requirement: Reconnect and session recovery
The system SHALL reconnect interrupted real-time transport with bounded exponential backoff, resume the same session and turn when the server confirms resumability, deduplicate replayed transcript/audio events, and never resume a cancelled or expired turn. If recovery fails, it MUST return to a stable state with text input available and a retry action.

#### Scenario: Recoverable transport drop
- **WHEN** the ASR or conversation WebSocket disconnects during capture or response delivery
- **THEN** the client shows reconnecting status, retries within configured limits, and resumes from the last acknowledged sequence

#### Scenario: Recovery cannot resume
- **WHEN** the session token or turn is expired, cancelled, or cannot be restored after retry limits
- **THEN** duplicate or stale events are discarded, the user receives a recoverable notice, and text input remains usable
