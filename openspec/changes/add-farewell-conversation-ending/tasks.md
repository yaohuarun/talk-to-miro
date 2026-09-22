# Tasks

## 1. Farewell Intent and Narrative

- [x] 1.1 Implement a deterministic definite-departure classifier before the Mock/Live generation split; verify fixtures accept common immediate farewells and reject tentative, conditional, quoted, or future departure statements.
- [x] 1.2 Add story-sensitive deterministic farewell wording with a neutral emotion, `farewell-nod` action, `farewell` beat, terminal flag, and `user-departure` reason; verify early- and late-story sessions produce valid terminal narratives without new clues.

## 2. Directive and Session Contract

- [x] 2.1 Extend the closed directive schema and client allowlists with the farewell action, terminal flag, and bounded end reason; verify unsupported actions, unknown reasons, and malformed terminal combinations cannot execute or close a session.
- [x] 2.2 Track terminal intent provisionally on the active turn and commit closure only after all farewell segments are finished or explicitly presented; verify generation, network arrival, and segment start alone leave the session open.
- [x] 2.3 Emit an explicit conversation-ended event after terminal commit and reject ordinary later turns on that closed session; verify the event includes the user-departure reason and post-closure input receives a non-retryable ended response.

## 3. Interruption and Client Experience

- [x] 3.1 Preserve standard supersession while a farewell is unfinished; verify a newer text or voice turn cancels farewell audio, subtitle, action, and terminal intent, and a late acknowledgement cannot close the session.
- [x] 3.2 Render a recognizable farewell nod and stable ended presentation, replace text/voice input with an accessible restart control, and prevent local submission after closure; verify visual-state and interaction tests cover the ended UI.
- [x] 3.3 Start a fresh session from restart without retaining the closed flag, prior history, queued output, or media; verify the restarted experience returns to the opening idle state and accepts input.

## 4. Verification

- [x] 4.1 Add unit and coordinator coverage for definite farewell, ambiguous departure, intimacy-sensitive wording, presentation-complete closure, interruption, stale acknowledgement, and post-closure rejection; verify the targeted suites pass.
- [x] 4.2 Run the complete test suite and production build, and record any browser/device-only restart or speech-completion follow-up separately; verify automated checks pass without starting or leaving a service on port 4174.
