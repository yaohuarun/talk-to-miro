# Spec Delta

## MODIFIED Requirements

### Requirement: Press-to-talk voice input
The system SHALL provide a press-to-talk voice control inside the conversation drawer that begins capturing user speech while pressed and ends capture when released. If microphone access is unavailable, denied, or fails, the system MUST explain the condition, keep the drawer recoverable, and retain text interaction.

#### Scenario: User records voice input
- **WHEN** the user opens the drawer and presses and holds the voice control with microphone permission granted
- **THEN** the character enters listening state and the captured utterance is submitted when the user releases the control

#### Scenario: Microphone permission is denied
- **WHEN** browser microphone permission is denied from the drawer
- **THEN** the user receives recoverable feedback and can switch to or continue with text input

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
