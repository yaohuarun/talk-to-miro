# Spec Delta

## ADDED Requirements

### Requirement: Visible real-time listening and interruption state
The system SHALL visibly distinguish passive listening, provisional speech recognition, backchannel suppression, interruption confirmation, reconnecting, and recovered states without obscuring Mira's active subtitle. The state feedback MUST be available as text for assistive technologies.

#### Scenario: User speaks while Mira is replying
- **WHEN** voice activity is detected during Mira's speech
- **THEN** the scene indicates that input is being evaluated and does not immediately switch Mira to an idle or interrupted state

#### Scenario: True interruption is confirmed
- **WHEN** the classifier confirms a substantive user utterance
- **THEN** the scene immediately shows listening/processing state, removes superseded output, and presents the new provisional user caption

#### Scenario: Backchannel is suppressed
- **WHEN** the classifier recognizes a short acknowledgement
- **THEN** the scene keeps Mira's speaking state and current subtitle while optionally showing a transient non-interrupting listening hint

### Requirement: Connection and speech performance feedback
The scene SHALL provide non-blocking indicators for microphone echo-control quality, streaming caption status, first-audio-packet latency, key stage timings, reconnecting, and session recovery. These indicators MUST not become a permanent chat transcript or shift the primary subtitle composition.

#### Scenario: Transport reconnects
- **WHEN** the real-time connection is temporarily lost
- **THEN** the scene shows reconnecting progress and then a recovered state when the session resumes, or a retry/text fallback when it does not

#### Scenario: Streaming caption is active
- **WHEN** an interim user transcript is available
- **THEN** the caption region shows it as provisional and replaces it with the final text without duplicating the line
