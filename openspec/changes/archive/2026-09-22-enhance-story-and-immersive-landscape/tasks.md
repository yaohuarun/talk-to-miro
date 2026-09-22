# Tasks

## 1. Relationship-led Mock narrative

- [x] 1.1 Add session-scoped beat, intimacy, clue, and intent state to Mock dialogue selection and verify a thank-you after the warm-drink exchange cannot replay the opening rain question.
- [x] 1.2 Define beat-local responses for acknowledgements and eligible photo, camera, waiting, and absent-person questions, and verify deterministic tests cover each resulting transition.
- [x] 1.3 Extend the response fixture with a narrator-or-Mira presentation cue while retaining a safe compatibility default, and verify existing response consumers continue to render valid replies.

## 2. Scene-integrated conversation treatment

- [x] 2.1 Move the active subtitle renderer into the scene lower third and verify its text remains readable over rain in compact portrait and desktop viewports.
- [x] 2.2 Render narrator and Mira cues with distinct hierarchy and speaker treatment, and verify the opening narration and an active Mira reply are visually distinguishable.
- [x] 2.3 Keep the text and voice composer outside the scene safe area and verify primary interaction controls remain reachable without obscuring Mira.

## 3. Immersive landscape behavior

- [x] 3.1 Add a user-activated immersive scene control that requests fullscreen and attempts landscape orientation only after the gesture, and verify supported browsers enter landscape without losing story state.
- [x] 3.2 Add non-blocking orientation guidance and portrait fallback behavior for rejected or unsupported browser APIs, and verify a simulated failure leaves the conversation usable.
- [x] 3.3 Treat fullscreen, resize, and orientation changes as visual reflow only, and verify an in-flight reply continues as its original active turn without stale cue playback.

## 4. Quality and documentation

- [x] 4.1 Add automated coverage for acknowledgement continuity, clue-gated progression, and response presentation cues, and verify the project test suite passes.
- [x] 4.2 Exercise compact portrait, standard portrait, landscape, and desktop compositions during active performance events, and verify no horizontal scrolling or hidden primary controls occur.
- [x] 4.3 Document immersive-entry behavior, browser fallback, and the relationship-led Mock story flow in the README, and verify it explains how to evaluate the feature without private credentials.
