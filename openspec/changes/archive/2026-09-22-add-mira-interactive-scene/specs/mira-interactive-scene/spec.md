# Spec Delta

## Purpose

Provide a responsive, scene-first coffee-shop experience where users perceive and interact with Mira as a present character instead of reading a conventional message thread.

## ADDED Requirements

### Requirement: Mobile-first scene presentation
The system SHALL render the rainy closing-coffee-shop setting and Mira as the dominant visual content on mobile viewports, with a readable subtitle region and persistent text and voice interaction entry points. The primary experience MUST NOT use a scrolling chat-message list.

#### Scenario: User opens the scene on a phone
- **WHEN** a user opens the experience on a narrow viewport
- **THEN** the background, Mira, subtitle area, text input, and voice control are usable without horizontal scrolling

#### Scenario: User opens the scene on desktop
- **WHEN** a user opens the experience on a desktop viewport
- **THEN** the same scene and interaction controls remain usable with the scene framed for the larger display

### Requirement: Visible character state
The system SHALL visibly distinguish Mira's idle, listening, thinking, and speaking states while a session is active.

#### Scenario: Mira awaits user input
- **WHEN** no turn is in progress
- **THEN** Mira is shown in an identifiable idle state

#### Scenario: A reply is being prepared or played
- **WHEN** the system is processing user input or delivering a reply
- **THEN** Mira visibly transitions to thinking or speaking respectively

### Requirement: Accessible state and media feedback
The system SHALL provide text-based status feedback for character state, microphone permission or availability, media loading, and recoverable media failures.

#### Scenario: A cinematic asset cannot load
- **WHEN** a required image or video event fails to load
- **THEN** the user sees a non-blocking failure notice and can continue the conversation

### Requirement: Responsive scene media lifecycle
The system SHALL show loading feedback before a scene media event, present the event only while its originating turn remains active, and return the scene to a stable state after the event completes or is cancelled.

#### Scenario: A scene video finishes
- **WHEN** a turn-scoped video event reaches its end without interruption
- **THEN** the video is removed or hidden and the scene returns to the state directed by that turn

