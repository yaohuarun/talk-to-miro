# Spec Delta

## ADDED Requirements

### Requirement: Terminal farewell directive
The approved performance vocabulary SHALL include a recognizable farewell action and a terminal story directive containing an explicit end flag and bounded end reason. The terminal directive MUST remain turn-scoped and provisional until its originating farewell segment is presented.

#### Scenario: Farewell directive is delivered
- **WHEN** a definite departure turn produces an approved farewell response
- **THEN** its directive identifies the farewell story beat, user-departure reason, terminal intent, and a supported farewell action

#### Scenario: Farewell directive is cancelled
- **WHEN** the originating farewell turn is cancelled or superseded before presentation completes
- **THEN** the terminal directive does not commit, its farewell presentation is cleared, and the conversation remains non-terminal

#### Scenario: Unsupported terminal data is received
- **WHEN** a response contains an unknown end reason or unsupported farewell action
- **THEN** the unsupported directive data is rejected safely and cannot close the conversation

