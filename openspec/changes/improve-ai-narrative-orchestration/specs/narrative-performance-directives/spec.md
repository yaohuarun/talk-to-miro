# Spec Delta

## ADDED Requirements

### Requirement: Non-repetitive and narratively grounded dialogue
The system SHALL prevent an accepted Mira response from repeating or closely paraphrasing a recent accepted Mira line without a contextually necessary reason. Every accepted response MUST remain grounded in Mira's established identity, the rainy closing-coffee-shop setting, supported props, committed clues, and current story beat. When a user requests an unrelated topic or attempts to replace the established setting or role, Mira SHALL acknowledge or briefly answer as appropriate and bridge back to the active narrative without inventing an unrelated plot. A failed validation or repair attempt MUST NOT add text, clues, or story progress to conversation state.

#### Scenario: Model repeats a recent line
- **WHEN** a generated response is identical or substantially similar to a recent accepted Mira response and the user did not explicitly request repetition
- **THEN** the system rejects that candidate, requests a non-repetitive repair using recent dialogue and story context, and accepts only a repaired or deterministic fallback response

#### Scenario: Repetition is explicitly requested
- **WHEN** the user clearly asks Mira to repeat or clarify a previous statement
- **THEN** the system may restate the relevant information while avoiding an endless generation loop and without duplicating the same response more than necessary

#### Scenario: User steers toward an unrelated plot
- **WHEN** the user asks Mira to adopt an incompatible identity, setting, prop, or unrelated storyline
- **THEN** Mira remains in character, does not commit the incompatible world state, and redirects the conversation toward the established scene or current story beat

#### Scenario: Repair remains invalid
- **WHEN** the single repair attempt is still repetitive or narratively ungrounded
- **THEN** the system presents a safe, non-repetitive, in-character fallback and leaves unapproved clues and story transitions unchanged

## MODIFIED Requirements

### Requirement: Structured performance directives
The system SHALL associate each accepted Mira response segment with a versioned, turn-scoped structured directive that can express dialogue text, emotion, expression or pose, non-speaking action, camera or environment change, effect, optional story progression, and image or video event. The server MUST validate and normalize directives from every generation mode before delivery. Unsupported or malformed visual fields MUST be replaced with safe defaults or omitted without preventing the text reply from completing.

#### Scenario: Valid response drives scene performance
- **WHEN** an active response segment includes a valid performance directive
- **THEN** the system delivers the normalized directive with that segment and the scene renders only its supported fields

#### Scenario: Response includes an unsupported directive
- **WHEN** a response segment includes an unknown emotion, action, effect, camera state, story transition, or media event
- **THEN** the unsupported field is rejected or normalized to a safe default and the user can still receive the segment's text reply

#### Scenario: Generation modes produce equivalent directives
- **WHEN** Live and Mock modes produce the same narrative intent
- **THEN** both modes emit the same canonical directive shape and are subject to the same validation and gating rules

### Requirement: Dialogue-triggered narrative events
The system SHALL advance a Mira story that can sustain a 3-5 minute interaction and includes a visibly distinct event gated by the active dialogue content, accepted clue, or current story beat rather than by a fixed elapsed-time timer. Story progression associated with a segment MUST be committed only after that segment is presented successfully.

#### Scenario: User asks about photographs or the camera
- **WHEN** the active conversation asks about Mira's photographs or camera at an eligible story point
- **THEN** Mira reveals a photo-oriented visual event and records the corresponding story progression only after the segment is presented

#### Scenario: User asks why Mira is waiting
- **WHEN** the active conversation asks about the person Mira is waiting for at an eligible story point
- **THEN** Mira transitions into the disclosure beat with an associated emotion and scene change

#### Scenario: An event is requested outside its eligible context
- **WHEN** a generated directive requests a gated event without the required dialogue, clue, or story beat
- **THEN** the system suppresses that event while preserving the reply text and other valid performance fields

### Requirement: Environment and cinematic change
The experience SHALL include at least one explicit directed background, camera, or environment change and at least one interruptible multimodal scene event. A segment's character, camera, environment, effect, and media directives MUST become active together when that segment begins presentation and MUST NOT be activated by receipt time alone.

#### Scenario: The story reaches its disclosure beat
- **WHEN** an active reply segment directs the disclosure presentation and begins presentation
- **THEN** the scene applies a recognizable camera or lighting change and presents the associated media only for that active turn

#### Scenario: A queued segment has not started
- **WHEN** a valid directive has been received for a segment whose audio or text presentation has not begun
- **THEN** the scene does not yet expose that segment's character, scene, effect, media, clue, or story transition

#### Scenario: Active presentation is superseded
- **WHEN** a new turn interrupts a segment with active character, scene, effect, or media directives
- **THEN** the previous segment's turn-scoped presentation is stopped and cleaned up before the new turn can drive the scene
