# Design

## Context

The conversation system already associates replies with sessions, turns, ordered segments, playback acknowledgements, and provisional story state. It also invalidates superseded turns across server and client. The farewell lifecycle should reuse these boundaries so closing a session is based on experienced output, not on receiving a departure phrase or generating text.

The same classifier must sit before the Mock/Live generation split. Otherwise provider variation could make identical departure statements behave differently. See `proposal.md` for motivation and the delta specs for observable behavior.

## Goals / Non-Goals

**Goals:**

- Distinguish immediate, definite departures from tentative future statements.
- Keep farewell generation deterministic and consistent across provider modes.
- Reuse segment acknowledgement as the single commit point for terminal state.
- Preserve interruption until farewell presentation completes.
- Expose a clear closed state and fresh-session restart path.

**Non-Goals:**

- Persisting closed conversations across page reloads or devices.
- Inferring emotional abandonment, dissatisfaction, or safety risk from ordinary wording.
- Ending on inactivity, timers, disconnects, or ambiguous phrases.
- Resuming the exact closed session after restart.

## Decisions

### 1. Classify farewell intent before response generation

A small deterministic classifier handles a curated vocabulary of immediate departure phrases and explicit ambiguity guards such as “等下”, “可能”, and “准备”. It operates on both typed input and finalized speech transcripts before the Mock/Live branch.

This is preferred over relying solely on the language model because termination is session control, not creative dialogue. The vocabulary stays deliberately narrow to favor false negatives over accidental closure.

### 2. Generate a deterministic, story-sensitive farewell

An approved farewell narrative selects wording according to established relationship depth while keeping the same terminal semantics. It uses a neutral emotion, a supported `farewell-nod` action, no new clue, the `farewell` beat, `endConversation: true`, and `endReason: user-departure`.

This prevents providers from inventing termination reasons or skipping the required closing reply while still allowing the line to acknowledge story progress.

### 3. Keep terminal state provisional on the turn

The coordinator records terminal intent on the active turn but does not mark the session closed when intent is classified, text is generated, or media arrives. The final segment acknowledgement commits history and the farewell beat, marks the session closed, and emits a dedicated `conversation.ended` event.

This mirrors delayed clue/story commit and ensures users hear or read Mira's farewell before controls close.

### 4. Preserve normal interruption semantics before commit

Until the farewell segment is acknowledged, a higher turn ID supersedes it like any other reply. Stale acknowledgements are rejected by active-turn and attempt checks, so a late audio completion cannot close the replacement conversation.

No special “undo close” operation is necessary because closure has not yet committed.

### 5. Treat restart as a fresh session

After `conversation.ended`, the client presents a stable ended state, replaces input controls with restart, and stops ordinary submission. Restart creates a new browser/session lifecycle rather than mutating the closed server session back to open.

This yields simple server invariants: closed sessions reject ordinary input, and session history never crosses restart boundaries.

## Risks / Trade-offs

- [A narrow classifier misses creative farewell wording] → Keep the vocabulary test-driven and expand it from observed phrases without making fuzzy closure decisions.
- [A broad phrase matches discussion about leaving rather than actual departure] → Anchor definite patterns and explicitly exclude tentative/future markers.
- [Browser speech completion may be delayed or blocked] → Preserve the existing explicit text-only presentation path; only an acknowledged path commits closure.
- [Reload-based restart loses prior context by design] → Clearly label restart as a new conversation and keep persistence out of scope.

## Migration Plan

1. Extend directive and client allowlists with the farewell action and terminal story fields.
2. Add deterministic departure classification and farewell narrative generation before the provider-mode split.
3. Add provisional terminal state to turns and commit it through existing segment acknowledgement.
4. Add the ended UI, restart control, and farewell animation.
5. Verify definite, tentative, interrupted, completed, post-closure, and restart paths; rollback by removing the pre-generation classifier and terminal event handling.
