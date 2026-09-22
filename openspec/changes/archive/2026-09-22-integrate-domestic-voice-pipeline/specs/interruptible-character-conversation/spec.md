# Spec Delta

## ADDED Requirements

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
