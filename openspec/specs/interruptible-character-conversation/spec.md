# interruptible-character-conversation Specification

## Purpose

Support continuous text and voice conversation with Mira while ensuring user interruption immediately supersedes an incomplete response across audio, subtitles, media, and network delivery.

## Requirements

### Requirement: Continuous multi-turn text conversation
The system SHALL accept consecutive text submissions in one session and preserve enough session context for Mira's later replies to reflect the ongoing conversation and current story state.

#### Scenario: User sends several text turns
- **WHEN** a user submits multiple text messages after receiving replies
- **THEN** each reply is associated with the active session and the conversation continues without resetting the scene

### Requirement: Press-to-talk voice input
The system SHALL provide a press-to-talk voice control inside the conversation drawer that begins capturing user speech while pressed and ends capture when released. If microphone access is unavailable, denied, or fails, the system MUST explain the condition, keep the drawer recoverable, and retain text interaction.

#### Scenario: User records voice input
- **WHEN** the user opens the drawer and presses and holds the voice control with microphone permission granted
- **THEN** the character enters listening state and the captured utterance is submitted when the user releases the control

#### Scenario: Microphone permission is denied
- **WHEN** browser microphone permission is denied from the drawer
- **THEN** the user receives recoverable feedback and can switch to or continue with text input

### Requirement: Spoken reply with synchronized subtitles
The system SHALL deliver Mira's response as audible speech when voice output is available and display its subtitle content while that response is active.

#### Scenario: Mira completes a voice reply
- **WHEN** an active response is successfully delivered
- **THEN** audio playback and subtitle presentation correspond to the same response turn

### Requirement: User interruption supersedes active output
The system SHALL treat a new press-to-talk interaction or new user submission from the conversation drawer during a reply as an interruption. It MUST immediately stop active reply audio, invalidate unfinished response content, clear queued subtitle, action, and media events, enter listening or processing state for the new input, and prevent superseded response data from resuming. The drawer MUST remain reachable while Mira is speaking.

#### Scenario: User interrupts Mira while she is speaking
- **WHEN** the user opens the drawer and begins press-to-talk while Mira's reply audio is playing
- **THEN** the audio stops immediately and no remaining subtitles, actions, or media from that reply are presented

#### Scenario: User submits text while Mira is speaking
- **WHEN** the user opens the drawer and submits a new text turn while Mira's reply is active
- **THEN** the active reply is invalidated and the new text turn becomes the only active response request

#### Scenario: Superseded response arrives late
- **WHEN** a cancelled turn later returns text, audio, or performance data
- **THEN** the late data does not alter the current character state or start output

### Requirement: Recoverable conversation failures
The system SHALL surface timeouts, connection failures, and response-generation failures without losing the user's ability to start a subsequent turn.

#### Scenario: A response request times out
- **WHEN** the active turn exceeds its configured response timeout
- **THEN** the system reports a retry option, returns to a stable non-speaking state, and accepts a new turn

### Requirement: Live domestic speech pipeline
In explicitly enabled live mode, the system SHALL transcribe actual microphone audio using a mainland Chinese provider, pass finalized text to a language model, and synthesize the validated response with provider TTS. Typed input SHALL use the same response pipeline without recognition. Interim transcripts MUST NOT start response generation. Empty audio MUST NOT generate a fabricated user utterance.

#### Scenario: Real voice exchange
- **WHEN** the user holds the voice control, speaks, and releases it
- **THEN** the finalized transcript drives the response and synthesized speech reflects that response

#### Scenario: Empty utterance
- **WHEN** recognition completes without speech
- **THEN** no model turn is generated and the user can retry or type

### Requirement: Sentence playback coordination
The system SHALL associate synthesized audio, subtitles, and performance cues with a session, turn, and ordered segment. A segment's subtitle and cues SHALL begin with its actual audio playback rather than network arrival. Invalid performance values MUST NOT execute. Speech failure SHALL leave response text available with explicit failure feedback.

#### Scenario: Buffered second sentence
- **WHEN** audio for the second sentence arrives while the first is playing
- **THEN** its subtitle and performance cues wait until second-sentence playback

#### Scenario: Speech synthesis fails
- **WHEN** validated response text exists but synthesis fails
- **THEN** the user can read the reply and explicitly retry speech without generating another model turn

### Requirement: End-to-end session cancellation
Cancellation SHALL stop local playback and queued events immediately, invalidate pending capture permissions and provider output, and terminate the superseded provider work where supported. Superseded results MUST NOT alter narrative history. One user's session MUST NOT cancel or modify another user's session.

#### Scenario: Late provider result
- **WHEN** an interrupted recognition, language-model, or speech task completes late
- **THEN** its output is discarded at both server and client gates

#### Scenario: Permission resolves after release
- **WHEN** microphone permission resolves after the user releases or cancels capture
- **THEN** tracks are closed and no orphan recording or submission starts

#### Scenario: Independent sessions
- **WHEN** one session interrupts a response
- **THEN** other sessions continue unaffected

### Requirement: Explicit provider configuration and recoverability
The system SHALL default to credential-free Mock mode and clearly distinguish it from live mode. Provider credentials SHALL remain server-only. Live mode with missing configuration SHALL report configuration failure rather than silently pretending to be live. Provider timeouts, connection loss, denied microphone access, and blocked audio playback SHALL offer a usable recovery path without automatically replaying cancelled turns.

#### Scenario: No credentials
- **WHEN** the application starts in default Mock mode without private credentials
- **THEN** deterministic story and interruption demonstrations work without cloud calls

#### Scenario: Live configuration missing
- **WHEN** live mode is selected without required credentials or model settings
- **THEN** the application reports the missing configuration without leaking secrets or submitting paid requests

#### Scenario: Provider disconnect
- **WHEN** a live provider connection closes unexpectedly
- **THEN** the active task is cleaned up and the user can retry or switch to text input
