# MVP Acceptance Record

Date: 2026-09-22

## Automated checks

- `npm test`: 40 checks passed, covering the versioned directive schema, Live/Mock normalization, narrative eligibility, near-duplicate rejection, bounded and rotating repair fallback, directive allowlists, delayed story commit, and stale turn/attempt rejection.
- `npm run build`: passed.

## Browser smoke check

Tested in local Chromium through the Vite development server at `http://localhost:5173`, at desktop size and an emulated 375 x 812 mobile viewport.

- Initial scene rendered without a message-list UI and exposed a labelled text field, send button, press-to-talk control, and character state. At 375 x 812, `document.documentElement.scrollWidth <= window.innerWidth` returned `true`.
- Submitting `给我看看你的照片` rendered the speaking state, photo-reveal content, and the camera-specific reply.
- Submitted `你在等谁`, then immediately submitted `雨会停吗`; the displayed result was only the latter response, confirming superseded output did not overwrite the current turn.
- Native microphone capture cannot be granted in this automation environment. The UI keeps text entry available and the implementation handles permission failure with a recoverable notice.
- Image reveal is DOM/CSS media in Mock mode; its turn-scoped removal is covered by the cancellation path and state guard tests.
- The photo flow was rechecked through browser automation: the first camera question produced a camera-holding cue, a follow-up photo request revealed the allowlisted Polaroid, and `你在等谁` activated vulnerable/softened performance, window-looking, lightning-window environment, and an independent slow camera push-in.
- A photo request followed immediately by `雨会停吗` left only the newer reply state; no Polaroid, video, prior subtitle, or disclosure classes reappeared.
- Browser checks at 320x568, 375x812, and 1280x800 reported no horizontal overflow after the directive renderer changes.
- Repetition and narrative-grounding logic is covered with deterministic server tests. Live-model adversarial sampling remains a provider-dependent follow-up rather than a Mock browser prerequisite.

## Physical-device follow-up

Before release, repeat the press-and-hold gesture on a physical mobile browser to verify the platform permission prompt and MediaRecorder capture. This is a device acceptance check, not a prerequisite for the credential-free Mock flow.

## Atmosphere and responsive review

- Verified no horizontal overflow in Chromium at 320x568, 375x812, 390x844, 430x932, and 1280x800.
- The review retains a warm amber interior against cool blue-green rain, with restrained layered precipitation and no additional UI chrome.
- Automated visual regression snapshots remain pending; functional test and production build pass.
