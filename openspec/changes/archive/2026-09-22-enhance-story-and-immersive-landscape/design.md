# Design

## Context

The existing Mock narrative chooses replies primarily from keyword routes, which can return the opening prompt after an otherwise valid acknowledgement. The scene already owns character performance and weather layers, but its subtitles sit outside the visual frame. See `proposal.md` for motivation and the `immersive-story-presentation` delta for required behavior.

## Goals / Non-Goals

**Goals:**

- Make Mock dialogue selection aware of relationship progression, revealed information, and short conversational follow-ups.
- Treat narration and active speech as scene layers, with clear speaker hierarchy and contrast over visual effects.
- Provide an opt-in immersive landscape experience that degrades safely on mobile browsers.
- Preserve active-turn cancellation safeguards across resize, fullscreen, and orientation changes.

**Non-Goals:**

- Forcing device orientation without a user gesture or browser permission.
- Replacing the current provider abstraction or requiring a real model provider.
- Adding a general branching-story editor or persistent cross-session player profile.

## Decisions

### Maintain compact narrative state per session

Represent the Mock story with `beat`, `intimacy`, `clues`, and `recentIntent`, then select a response from the current beat before considering broad keyword fallbacks. Each response will advance only the relevant state and continue using the existing turn-scoped performance directives.

This prevents short acknowledgements from matching a generic opening route. A free-form prompt-only implementation was considered, but a compact state machine remains deterministic, testable, and appropriate for the credential-free MVP.

### Add a presentation cue alongside response text

Extend the response contract with a display-oriented cue identifying narrator versus Mira speech. The client renders that cue as a lower-third layer inside the scene; the composer stays below the scene to preserve input access and avoid covering Mira.

The client could infer the speaker from text, but explicit cues avoid brittle heuristics and allow the server's story fixture to define the opening narrator moment.

### Make immersive landscape an opt-in browser capability

The scene will expose a user-activated immersive control. Following that gesture, the client requests fullscreen where available and attempts `screen.orientation.lock('landscape')`. Failure is caught locally: a rotate hint appears, portrait composition remains active, and no conversation state changes.

Automatic orientation at page load was rejected because mobile browsers commonly reject it without a gesture and it would make the normal portrait entry path fragile. The feature does not depend on fullscreen succeeding.

### Treat viewport changes as visual reflow, not turns

Fullscreen and orientation events only recompute layout classes and do not create or invalidate conversation turn identifiers. Existing response validity checks continue to gate subtitle, audio, action, and media output.

Cancelling an active response during reflow was considered, but retaining it gives a stable experience and avoids implying that a device rotation was an interruption.

## Risks / Trade-offs

- [Mobile orientation APIs vary by browser and OS] -> Attempt only after an explicit gesture, catch every failure, and leave portrait controls fully functional.
- [Story-state rules can still feel mechanical] -> Cover acknowledgements and clue questions with deterministic fixtures, then keep a beat-local fallback response rather than returning to a global opener.
- [Lower-third text can compete with rain and character framing] -> Reserve a contrast-backed safe area, use speaker-specific typography, and test compact portrait plus landscape viewports.
- [Resize races could expose stale cues] -> Keep all visible content keyed to the existing active turn and test orientation changes during response delivery.

## Migration Plan

1. Extend local Mock session fixtures and response contract while retaining a compatibility default for callers without a presentation cue.
2. Move the subtitle renderer into the scene and verify portrait behavior before enabling immersive entry.
3. Add the gesture-driven fullscreen/orientation attempt and its fallback hint.
4. Validate the new deterministic story routes, active-turn behavior, and compact portrait/landscape layouts. Rollback consists of disabling immersive entry and using the existing portrait framing; Mock response text remains usable.
