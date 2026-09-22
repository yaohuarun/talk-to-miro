# Proposal

## Why

Mira currently treats clear departure statements like ordinary dialogue, which makes the character feel inattentive and leaves the session without a natural conclusion. The experience needs an explicit, interruptible farewell lifecycle that lets Mira respond in character before the conversation becomes closed.

## What Changes

- Recognize definite user-departure intent such as “再见”, “我要走了”, “要回家了”, and “下次聊” consistently in Mock and Live paths.
- Keep tentative or future departure language such as “等下要走” or “可能要回家” inside the active conversation.
- Produce a story-appropriate farewell reply and a recognizable farewell action.
- Commit the closed state only after the farewell segment has actually been presented; allow a new user turn to interrupt an unfinished farewell.
- Reject ordinary follow-up turns after closure and replace input controls with an explicit way to start a fresh session.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interruptible-character-conversation`: Add definite departure recognition, presentation-complete conversation closure, pre-completion interruption, post-closure behavior, and restart semantics.
- `narrative-performance-directives`: Add an approved farewell action and terminal story directive tied to the presented farewell segment.

## Impact

- Intent classification and deterministic story responses.
- Server conversation session state, segment acknowledgement, and WebSocket events.
- Structured directive schema and client directive allowlists.
- React conversation controls, status feedback, farewell animation, and restart flow.
- Unit, orchestration, visual-state, and build verification.
