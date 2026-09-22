# Spec Delta

## ADDED Requirements

### Requirement: Presentation-complete farewell lifecycle
The system SHALL recognize a definite user-departure intent in typed or finalized voice input, deliver an in-character farewell reply, and close the conversation only after the farewell segment has been successfully presented. Tentative, conditional, or future departure statements MUST NOT close the conversation. The same behavior SHALL apply in Mock and Live modes.

#### Scenario: User clearly says goodbye
- **WHEN** the active user turn clearly communicates immediate departure, such as “再见”, “我要走了”, “要回家了”, or “下次聊”
- **THEN** Mira presents a story-appropriate farewell and the conversation remains active until that farewell segment completes

#### Scenario: User mentions a possible later departure
- **WHEN** the user says they may leave later, are preparing to leave, or otherwise expresses uncertain departure
- **THEN** Mira may respond naturally but the system does not schedule or commit conversation closure

#### Scenario: Farewell presentation completes
- **WHEN** the farewell segment finishes audio playback or is explicitly presented through the text-only path
- **THEN** the session enters a closed state, reports that the conversation ended because of user departure, and does not accept ordinary subsequent turns

#### Scenario: User interrupts the farewell
- **WHEN** the user submits new text or begins a new voice turn before the farewell segment completes
- **THEN** the unfinished farewell is superseded, the session remains open, and obsolete farewell completion cannot close it later

#### Scenario: User starts again after closure
- **WHEN** the closed experience offers restart and the user activates it
- **THEN** a fresh conversation session begins without carrying the prior closed state or unfinished output

