# Tasks

## 1. Drawer interaction model

- [x] 1.1 Replace the permanently exposed composer with an accessible scene-level conversation trigger and controlled drawer state, and verify the scene is unobstructed when the drawer is closed.
- [x] 1.2 Render text and press-to-talk modes within the drawer, including explicit close and mode-switch controls, and verify all interactive targets remain at least 44px.
- [x] 1.3 Keep the drawer open after submission and replies; close only using the close button, preserve unsent drafts, and return focus to the trigger. Verify through the close handler, browser draft checks, and the test suite.

## 2. Responsive scene composition

- [x] 2.1 Implement a portrait bottom-sheet drawer that avoids the scene subtitle safe area, and verify 320px and 390px portrait layouts have no horizontal scrolling.
- [x] 2.2 Implement a centered bottom input bar in landscape and fullscreen without changing scene width; verify subtitle clearance at 844x390.
- [x] 2.3 Add reduced-motion and keyboard-safe drawer transitions, and verify the CSS regression suite covers drawer, portrait, and landscape selectors.

## 3. Interruption and recovery

- [x] 3.1 Keep the conversation trigger available while Mira is speaking, and verify opening the drawer alone does not cancel the active turn.
- [x] 3.2 Route drawer text submission and press-to-talk start through the existing cancellation gate, and verify active speech, media, and stale responses are invalidated by a new turn.
- [x] 3.3 Preserve text-mode access and clear feedback after microphone permission failure, and verify the drawer remains usable without microphone access.

## 4. Documentation and validation

- [x] 4.1 Update the README with drawer placement, interruption, and orientation behavior, and verify the credential-free evaluation path remains documented.
- [x] 4.2 Run automated tests, production build, and compact portrait/landscape browser checks, and verify all pass without console errors or horizontal scrolling.
