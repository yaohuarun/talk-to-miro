# Mira Interactive Scene Specification

## Purpose

Provide a responsive, scene-first coffee-shop experience where users perceive and interact with Mira as a present character instead of reading a conventional message thread.

## Requirements

### Requirement: Mobile-first scene presentation
The system SHALL render the rainy closing-coffee-shop setting and Mira as the dominant visual content on mobile viewports, with a readable subtitle region and a persistent conversation entry control. The entry control SHALL open text and voice interaction in a contextual drawer rather than using a permanently exposed inline composer. The primary experience MUST NOT use a scrolling chat-message list.

#### Scenario: User opens the scene on a phone
- **WHEN** a user opens the experience on a narrow viewport
- **THEN** the background, Mira, subtitle area, and conversation entry control are usable without horizontal scrolling

#### Scenario: User opens the conversation drawer in portrait
- **WHEN** a user activates the conversation entry control on a portrait viewport
- **THEN** text and voice controls appear in a bottom drawer without obscuring the active scene subtitle

#### Scenario: User opens the conversation drawer in landscape
- **WHEN** a user activates the conversation entry control on a landscape or immersive viewport
- **THEN** text and voice controls rise from the bottom in a centered compact drawer, without reserving a side column or resizing the scene, while the subtitle moves clear of the drawer

#### Scenario: User opens the scene on desktop
- **WHEN** a user opens the experience on a desktop viewport
- **THEN** the same scene and drawer-based interaction remain usable with the scene framed for the larger display

### Requirement: Explicit drawer dismissal
The conversation drawer SHALL remain open after text or voice submission and Mira's reply. Only activation of its close button SHALL hide it; background clicks and Escape MUST NOT dismiss it. Closing SHALL preserve unsent text and return focus to the conversation trigger.

#### Scenario: Continuous interaction
- **WHEN** the user submits input and Mira responds
- **THEN** the drawer remains visible for further input

#### Scenario: Background and keyboard dismissal are disabled
- **WHEN** the user clicks outside the drawer or presses Escape
- **THEN** the drawer remains open

#### Scenario: Explicit close and reopen
- **WHEN** the user closes the drawer with unsent text and opens it again
- **THEN** the draft remains available and closing has returned focus to the scene trigger

### Requirement: Unified scene text and bottom entry
Mira dialogue and narration SHALL use the same text styling and scene position with distinct speaker labels. The conversation trigger SHALL be near the scene bottom, and subtitles SHALL avoid overlap with the trigger or open drawer.

#### Scenario: Speaker changes
- **WHEN** Mira replies after the opening narration
- **THEN** text retains the narrator treatment and placement while the label changes to MIRA

#### Scenario: Input opens
- **WHEN** the bottom drawer opens
- **THEN** subtitles move clear of the input area without changing scene width

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
