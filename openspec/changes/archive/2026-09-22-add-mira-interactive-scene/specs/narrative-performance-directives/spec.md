# Spec Delta

## Purpose

Define a deterministic, safe performance contract through which Mira's dialogue can change character expression, scene presentation, branching story state, and multimodal events during the coffee-shop narrative.

## ADDED Requirements

### Requirement: Structured performance directives
The system SHALL associate each accepted Mira response with a turn-scoped structured directive that can express emotion, expression or pose, non-speaking action, camera or environment change, effect, optional story branch, and image or video event. Unsupported or malformed fields MUST be ignored safely without preventing the text reply from completing.

#### Scenario: Valid response drives scene performance
- **WHEN** a response includes a valid performance directive for the active turn
- **THEN** the scene renders only the supported directive fields while delivering that turn's reply

#### Scenario: Response includes an unsupported directive
- **WHEN** a response includes an unknown action or media event
- **THEN** the unsupported field is ignored and the user can still receive the remaining reply

### Requirement: Recognizable emotional and physical performance
The experience SHALL present at least three recognizable Mira emotional or expression states and at least two recognizable non-speaking actions or visual states during a session.

#### Scenario: Conversation reaches varied emotional beats
- **WHEN** the user explores the opening, guarded, and disclosure portions of the story
- **THEN** the scene can visibly distinguish calm or curious, hesitant or guarded, and vulnerable or warm character presentation

#### Scenario: A response directs an action
- **WHEN** Mira's response references the rain, her camera, or the person she awaits
- **THEN** the scene can show a non-speaking action such as looking toward the window, holding the camera, or adjusting her raincoat

### Requirement: Dialogue-triggered narrative events
The system SHALL advance a Mira story that can sustain a 3-5 minute interaction and includes a visibly distinct event triggered by the current dialogue content or story milestone, rather than by a fixed elapsed-time timer.

#### Scenario: User asks about photographs or the camera
- **WHEN** the active conversation asks about Mira's photographs or camera at an eligible story point
- **THEN** Mira reveals a photo-oriented visual event and records the corresponding story progression

#### Scenario: User asks why Mira is waiting
- **WHEN** the active conversation asks about the person Mira is waiting for at an eligible story point
- **THEN** Mira transitions into the disclosure beat with an associated emotion and scene change

### Requirement: Environment and cinematic change
The experience SHALL include at least one directed background, camera, or environment change and at least one interruptible multimodal scene event.

#### Scenario: The story reaches its disclosure beat
- **WHEN** an active reply directs the disclosure presentation
- **THEN** the scene applies a recognizable camera or lighting change and plays or reveals the associated media only for that active turn

### Requirement: Credential-free mock demonstration
The system SHALL provide a default local Mock mode with deterministic dialogue, directives, and media behavior that demonstrates the core story and interruption flows without a private API key.

#### Scenario: Evaluator starts Mock mode
- **WHEN** the application is started without model-provider credentials
- **THEN** the evaluator can complete text interaction, voice-control UI flow, performance events, and interruption behavior using local deterministic responses

