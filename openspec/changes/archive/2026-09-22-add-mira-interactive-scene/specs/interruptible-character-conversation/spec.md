# Spec Delta

## Purpose

Support continuous text and voice conversation with Mira while ensuring user interruption immediately supersedes an incomplete response across audio, subtitles, media, and network delivery.

## ADDED Requirements

### Requirement: Continuous multi-turn text conversation
The system SHALL accept consecutive text submissions in one session and preserve enough session context for Mira's later replies to reflect the ongoing conversation and current story state.

#### Scenario: User sends several text turns
- **WHEN** a user submits multiple text messages after receiving replies
- **THEN** each reply is associated with the active session and the conversation continues without resetting the scene

### Requirement: Press-to-talk voice input
The system SHALL provide a press-to-talk voice control that begins capturing user speech while pressed and ends capture when released. If microphone access is unavailable, denied, or fails, the system MUST explain the condition and retain text interaction.

#### Scenario: User records voice input
- **WHEN** the user presses and holds the voice control with microphone permission granted
- **THEN** the character enters listening state and the captured utterance is submitted when the user releases the control

#### Scenario: Microphone permission is denied
- **WHEN** browser microphone permission is denied
- **THEN** the user receives recoverable feedback and can continue with text input

### Requirement: Spoken reply with synchronized subtitles
The system SHALL deliver Mira's response as audible speech when voice output is available and display its subtitle content while that response is active.

#### Scenario: Mira completes a voice reply
- **WHEN** an active response is successfully delivered
- **THEN** audio playback and subtitle presentation correspond to the same response turn

### Requirement: User interruption supersedes active output
The system SHALL treat a new press-to-talk interaction or new user submission during a reply as an interruption. It MUST immediately stop active reply audio, invalidate unfinished response content, clear queued subtitle, action, and media events, enter listening or processing state for the new input, and prevent superseded response data from resuming.

#### Scenario: User interrupts Mira while she is speaking
- **WHEN** the user begins press-to-talk while Mira's reply audio is playing
- **THEN** the audio stops immediately and no remaining subtitles, actions, or media from that reply are presented

#### Scenario: Superseded response arrives late
- **WHEN** a cancelled turn later returns text, audio, or performance data
- **THEN** the late data does not alter the current character state or start output

### Requirement: Recoverable conversation failures
The system SHALL surface timeouts, connection failures, and response-generation failures without losing the user's ability to start a subsequent turn.

#### Scenario: A response request times out
- **WHEN** the active turn exceeds its configured response timeout
- **THEN** the system reports a retry option, returns to a stable non-speaking state, and accepts a new turn

