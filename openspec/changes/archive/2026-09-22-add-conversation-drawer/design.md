# Design

## Context

The current scene keeps its text/voice composer permanently below the scene. Since subtitles now live inside the visual lower third, the composer competes for vertical attention, particularly on phones. See `proposal.md` for motivation and the modified scene and interruption specifications for behavior.

## Goals / Non-Goals

**Goals:**

- Make the interaction entry present but visually quiet when the user is observing the scene.
- Preserve text, press-to-talk, error recovery, and interruption semantics.
- Adapt the drawer without covering the lower-third subtitle or Mira in portrait, landscape, and fullscreen contexts.

**Non-Goals:**

- Adding chat history, a new voice transcription provider, or persistent drawer preferences.
- Replacing browser-native focus and keyboard behavior with a custom modal framework.

## Decisions

### Use a single controlled drawer state

The client holds a `drawerOpen` state. A compact scene-level conversation trigger near the bottom opens it. Submissions, replies, background clicks, and Escape leave it open; only the explicit close control hides it and returns focus to the trigger. Unsent drafts survive closing and reopening.

This is simpler than keeping a hidden form mounted with visual toggles, and it gives a predictable focus return. The existing always-visible composer was rejected because it keeps competing with the performance scene.

### Adapt placement by available scene geometry

Every orientation uses a bottom sheet with a subtle backdrop. Landscape and fullscreen use a centered compact bottom bar. Opening does not reserve a side column or change scene geometry. The drawer carries the input-mode toggle, text field, send control, and press-to-talk control. VisualViewport updates keep the sheet above the keyboard, and measured drawer bounds move the subtitle above it. The fullscreen target contains both scene and drawer. Mira speech shares narrator styling and placement, with the speaker label retained.

A centered modal was considered but rejected because it would cover Mira and the cinematic lower third. A separate route was rejected because it would break conversational continuity.

### Keep interruption independent of drawer visibility

Opening the drawer does not cancel a response. Submitting text or beginning press-to-talk calls the existing cancellation path exactly once, which invalidates the active turn before requesting a new one. This lets users decide whether to interrupt after opening the drawer.

Closing the drawer does not cancel an active reply. This avoids turning a navigation gesture into an accidental interruption.

## Risks / Trade-offs

- [Soft keyboard can compress portrait space] -> Use a scrollable drawer interior and retain the subtitle above its reserved boundary.
- [Focus may be lost after a drawer closes] -> Restore focus to the trigger and expose controls with labels and 44px targets.
- [A speaking user needs an immediate interruption path] -> Keep the scene trigger visible in every phase and present text/voice controls immediately after opening.
- [Fullscreen browser styling differs] -> Fullscreen the application container so the bottom sheet remains visible alongside the scene.

## Migration Plan

1. Replace the exposed composer with the trigger and controlled drawer without changing turn handling.
2. Apply portrait and landscape placement rules, then verify scene subtitle visibility at compact mobile dimensions.
3. Verify text and voice interruption, denied microphone recovery, focus return, and fullscreen behavior.
4. Rollback consists of rendering the existing composer in place of the drawer while leaving the conversation protocol unchanged.
