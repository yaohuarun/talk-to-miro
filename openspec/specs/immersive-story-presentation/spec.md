# Immersive Story Presentation Specification

## Purpose

Make Mira's coffee-shop encounter progress as a coherent relationship-led story while keeping dialogue and narration visually embedded in an immersive scene on mobile and desktop.

## Requirements

### Requirement: Relationship-aware story progression
The system SHALL select each Mock-story response using the current story beat, relationship level, revealed clues, and the user's current conversational intent. Acknowledgements, thanks, and other short follow-ups MUST preserve the established beat rather than restarting the opening exchange.

#### Scenario: Acknowledgement follows the shared-shelter beat
- **WHEN** the user thanks Mira after she offers a warm drink
- **THEN** the next response remains in or advances from the shared-shelter beat and does not repeat the opening rain question

#### Scenario: Eligible question reveals a story clue
- **WHEN** the user asks about Mira's photos, camera, waiting, or absent person at an eligible story beat
- **THEN** the system selects a response that reveals or develops the relevant clue and records the new story progression

### Requirement: Scene-integrated subtitles and narration
The system SHALL render narrator cues and Mira's active reply within the scene's lower-third composition while keeping the interaction composer clear of the subtitle area. Narration and Mira speech MUST use the same visual treatment and position, be distinguishable by speaker labels, and remain readable over the moving rain background. An open input drawer SHALL cause subtitle placement to avoid overlap.

#### Scenario: The scene establishes the encounter
- **WHEN** the opening story cue is displayed
- **THEN** the scene shows a narrator treatment inside its composition that establishes the closing coffee shop and Mira waiting by the window

#### Scenario: Mira replies during an active turn
- **WHEN** an accepted Mira response is delivered
- **THEN** the lower-third displays a Mira-labelled subtitle within the scene and the conversation entry or open input drawer remains available for the next interaction

### Requirement: User-initiated immersive landscape entry
The system SHALL offer a user-initiated way to enter an immersive scene view and attempt landscape presentation after that gesture. The system MUST retain a fully usable portrait layout when fullscreen or orientation locking is unavailable, denied, or exited.

#### Scenario: Browser supports immersive landscape
- **WHEN** the user chooses to enter the immersive scene and the browser permits fullscreen and landscape orientation
- **THEN** the scene enters immersive landscape presentation without losing the current story state

#### Scenario: Browser denies orientation control
- **WHEN** the user chooses immersive scene view but fullscreen or orientation locking is unsupported or denied
- **THEN** the system provides a non-blocking rotate hint and keeps the portrait experience usable

### Requirement: Responsive turn continuity during reflow
The system SHALL preserve the currently active turn and show only the active turn's subtitle and performance cues while the viewport or device orientation changes.

#### Scenario: Device orientation changes during Mira's reply
- **WHEN** the viewport changes from portrait to landscape or back while a valid response is active
- **THEN** the response remains associated with its original turn and stale response content does not appear
