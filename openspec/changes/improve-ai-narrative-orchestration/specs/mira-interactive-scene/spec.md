# Spec Delta

## MODIFIED Requirements

### Requirement: Visible character state
The system SHALL visibly distinguish Mira's idle, listening, thinking, and speaking states while a session is active. During reply presentation, the scene SHALL also render approved emotion, expression or pose, and non-speaking action directives as recognizable visual changes, including at least three distinct emotional or expression states and at least two distinct non-speaking actions.

#### Scenario: Mira awaits user input
- **WHEN** no turn is in progress
- **THEN** Mira is shown in an identifiable idle state

#### Scenario: A reply is being prepared or played
- **WHEN** the system is processing user input or delivering a reply
- **THEN** Mira visibly transitions to thinking or speaking respectively

#### Scenario: A reply directs character performance
- **WHEN** an active reply begins presentation with a supported emotion and non-speaking action
- **THEN** Mira displays both cues distinctly enough to differentiate the supported performance vocabulary

### Requirement: Accessible state and media feedback
The system SHALL provide text-based status feedback for character state, microphone permission or availability, media loading, recoverable media failures, and blocked media playback. A failed visual or media directive MUST NOT prevent its dialogue text from being read or heard.

#### Scenario: A cinematic asset cannot load
- **WHEN** a required image or video event fails to load
- **THEN** the user sees a non-blocking failure notice, the dialogue remains available, and the conversation can continue

#### Scenario: Media playback is blocked
- **WHEN** browser policy prevents an active media event from starting
- **THEN** the user receives an actionable status message and can continue through a supported text-only path

### Requirement: Responsive scene media lifecycle
The system SHALL represent approved camera, environment, effect, image, and video directives through explicit turn-scoped scene state. It SHALL show loading feedback before an asset-backed event, present the event only while its originating turn and segment remain active, and return the scene to a stable state after the event completes, fails, or is cancelled.

#### Scenario: A scene image becomes active
- **WHEN** the active reply segment directs an eligible image reveal and its asset is ready
- **THEN** the image is presented with the segment's character and scene state and is removed when that state is no longer active

#### Scenario: A scene video finishes
- **WHEN** a turn-scoped video event reaches its end without interruption
- **THEN** the video is removed or hidden and the scene returns to the stable state directed by that turn

#### Scenario: A scene event is interrupted
- **WHEN** the user starts a new turn, cancels, backgrounds the page, or disconnects while an image, video, effect, or camera transition is active
- **THEN** active media and transient scene changes stop, their resources are released, and no late event can restore the obsolete state

