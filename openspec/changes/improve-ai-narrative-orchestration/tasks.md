# Tasks

## 1. Canonical Directive Contract

- [x] 1.1 Define a closed, versioned canonical directive schema covering character, cinematic, effect, story, and allowlisted media fields; verify schema tests accept every supported value and reject unknown fields, oversized values, arbitrary URLs, and executable content.
- [x] 1.2 Implement Live-model and Mock-story adapters into the canonical directive, preserving safe text when optional visual fields are invalid; verify adapter tests produce equivalent directives for equivalent narrative intent and exercise safe defaults.
- [x] 1.3 Add narrative eligibility checks for photo reveal, waiting-person disclosure, clues, and story beats; verify tests suppress ineligible events without dropping dialogue or other valid fields.
- [x] 1.4 Implement conservative exact and near-duplicate detection against recent accepted assistant dialogue, with explicit repeat/clarify exemptions; verify Chinese fixtures cover verbatim loops, close paraphrases, short generic phrases, legitimate callbacks, and user-requested repetition.
- [x] 1.5 Add narrative-grounding validation for Mira's identity, coffee-shop setting, supported props, committed clues, and current beat; verify attempts to introduce incompatible roles, settings, props, or plots are rejected while harmless off-topic questions receive a brief acknowledgement and bridge back.
- [x] 1.6 Add one bounded repair attempt carrying the rejection reason and authoritative context, followed by a deterministic beat-appropriate fallback with neutral directives; verify repeated repair failure terminates without recursion and does not mutate history, clues, or story state.

## 2. Conversation Transport and Story Semantics

- [x] 2.1 Add the versioned approved directive to `response.segment` while retaining the existing performance payload for compatibility; verify WebSocket contract tests cover both the new payload and text-only fallback for an unsupported version.
- [x] 2.2 Preserve segment-scoped provisional `nextBeat` and clue data until `segment.finished` or `segment.presented`; verify coordinator tests prove queued, failed, and cancelled segments do not commit story progress.
- [x] 2.3 Extend supersession and cancellation handling to invalidate pending directive and media work by turn, segment, and attempt; verify stale callbacks cannot send or commit obsolete scene events.

## 3. Scene Rendering

- [x] 3.1 Replace permissive client sanitization with version-aware parsing and allowlists for character, camera/environment, effects, and media, falling back to text-only presentation; verify client protocol tests cover valid, malformed, and future-version directives.
- [x] 3.2 Introduce explicit scene layers for character performance, cinematic state, transient effects, and media, and activate them only at the segment presentation-start boundary; verify component tests show receipt alone does not change the scene and start activates all layers together.
- [x] 3.3 Map at least three recognizable emotions or expressions and at least two non-speaking actions to distinct visual treatments, preserving existing responsive and reduced-motion behavior; verify automated selectors plus browser review at compact, standard mobile, and desktop viewports.
- [x] 3.4 Implement an independent camera/environment renderer for the disclosure push-in and lightning/lighting changes rather than coupling camera state to an effect class; verify the eligible disclosure path visibly changes framing/environment and an ordinary reply does not.

## 4. Media Lifecycle and Recovery

- [x] 4.1 Add an allowlisted media registry and preload/loading state for the existing photo reveal plus a video-capable renderer boundary; verify unknown asset IDs and external URLs are rejected and asset failure leaves dialogue usable.
- [x] 4.2 Centralize scene cleanup for new input, explicit cancellation, page backgrounding, disconnect, media completion/failure, and unmount; verify interruption tests stop active media/effects, restore stable state, release resources, and ignore late completion events.
- [x] 4.3 Provide accessible loading, blocked-playback, and recoverable-failure feedback with a text-only continuation path; verify status announcements and controls remain usable when image or media playback is unavailable.

## 5. End-to-End Verification

- [x] 5.1 Extend deterministic Mock flows to demonstrate calm/curious/vulnerable presentation, window/camera actions, disclosure lighting/push-in, and dialogue-triggered photo reveal without credentials; verify the complete path through browser automation.
- [x] 5.2 Add an interruption scenario that triggers a visual event and immediately starts another turn; verify the obsolete subtitle, character state, cinematic state, effects, media, clue, and story beat cannot reappear or commit.
- [x] 5.3 Add multi-turn adversarial dialogue scenarios for repeated prompts, model self-repetition, explicit repeat requests, unrelated topics, and attempts to rewrite Mira's world; verify conversations terminate each generation attempt, remain coherent, and continue from the committed beat.
- [x] 5.4 Run the full unit/integration suite and production build, then record browser acceptance for current Chromium viewports and physical-device follow-ups for iOS Safari and Android Chrome; verify all automated commands pass and the acceptance document distinguishes completed checks from pending device checks.
