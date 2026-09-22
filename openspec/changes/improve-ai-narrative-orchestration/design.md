# Design

## Context

The application already has a useful but split pipeline: Qwen emits `emotion`, `action`, `event`, and `clue`; Mock story responses use a richer frontend-oriented performance object; the server maps both forms into a `response.segment`; and React maps selected fields into CSS classes and a DOM-based photo reveal. Turn IDs already reject stale network events, and story history is committed only after presentation acknowledgement.

The main constraints are preserving the existing text and voice path, retaining credential-free deterministic Mock behavior, treating model output as untrusted, and keeping visual changes synchronized with the segment that users actually experience. See `proposal.md` for motivation and the two delta specs for observable behavior.

## Goals / Non-Goals

**Goals:**

- Establish one internal directive vocabulary shared by Live and Mock generation.
- Separate validation, narrative eligibility, transport, and rendering responsibilities.
- Give character, camera/environment, effects, and media explicit turn-scoped lifecycles.
- Preserve text delivery when any optional visual directive or asset fails.
- Make current minimum performance coverage directly testable.
- Prevent repetitive output and narrative drift before a response can affect dialogue history or scene state.

**Non-Goals:**

- Replacing the existing LLM, ASR, TTS, or WebSocket providers.
- Building a general-purpose cut-scene editor or arbitrary model-generated CSS/URLs.
- Requiring video content for the initial acceptance path; the contract and renderer boundary will support it when an allowlisted asset is configured.
- Word-level animation synchronization; directives remain segment-scoped.

## Decisions

### 1. Use one canonical server-owned directive

Each normalized segment will carry a directive version and explicit fields for character state, scene state, story intent, and media intent. Provider and Mock outputs are adapters into this representation; the browser does not interpret raw model enums.

This keeps compatibility decisions on the trusted server and removes today's double mapping between narrative enums and frontend performance fields. The alternative—letting each generator emit frontend classes—would couple prompts and story fixtures to presentation implementation and expand the injection surface.

### 2. Validate in two stages: shape, then eligibility

Structural validation will enforce enumerations, limits, and closed object shapes. Narrative approval will then gate contextual events such as `photo-reveal` or disclosure lighting using the response text, current beat, and committed clues. Invalid optional fields degrade independently to safe defaults; invalid required dialogue structure remains a generation error.

This distinguishes malformed data from narratively inappropriate but otherwise well-formed data. It also allows the text reply to survive a bad optional visual field.

### 3. Keep the wire payload declarative and versioned

`response.segment` will transport the approved directive as data with a schema version. It will not transport CSS class names, executable handlers, arbitrary URLs, or provider-specific fields. The client will support the current version and safely reduce unknown future versions to text-only presentation.

Versioning makes the failure behavior explicit and allows a later media vocabulary without silently misrendering older clients. No separate imperative scene command stream is introduced because segment metadata already supplies ordering and turn identity.

### 4. Activate directives at presentation start

The client will continue buffering `response.segment` metadata and audio. It will activate the segment's directive from the same presentation-start boundary that displays the subtitle and begins audio, or from the equivalent text-only/Mock presentation boundary. Receipt of a queued segment does not mutate the visible scene.

This preserves synchronization across variable TTS latency and multiple response segments. Applying directives immediately on receipt was rejected because it can expose later lines, clues, and visual events before their audio.

### 5. Model scene rendering as replaceable layers

The React scene state will expose four allowlisted layers:

- character: emotion/expression/pose and non-speaking action;
- cinematic: camera framing and environment state;
- transient effects: lightning, glow, and related short visual treatments;
- media: image or video asset identity plus lifecycle status.

Each layer is replaced from the active directive rather than accumulated across turns. Renderers map semantic tokens to local CSS/DOM/media implementations. This makes `camera: slow-push-in` independently testable instead of depending accidentally on a `lightning` class.

### 6. Centralize cleanup under the active-turn generation

Starting or cancelling a turn, page backgrounding, disconnect, media failure, and component teardown will all invalidate the active presentation generation. Cleanup stops audio/video, clears queued segment metadata and transient effects, revokes any acquired media resources, and restores a stable baseline. Late callbacks must compare both turn identity and the relevant segment/attempt before mutating state.

This extends the existing audio generation guard to all visual layers and prevents stale media completion events from reviving an obsolete scene.

### 7. Commit story state only from completed presentation

`nextBeat` and clue changes remain provisional on the server until a segment is acknowledged as finished or deliberately presented as text-only. Cancellation and failed, unpresented media do not commit their narrative effects. Media failure alone does not block commit when the accompanying dialogue is successfully presented.

This preserves the established delayed-commit behavior while clarifying that story progress follows experienced dialogue, not optional asset success.

### 8. Apply bounded dialogue-quality validation before directive approval

After structural parsing, the server will compare candidate dialogue with recent accepted assistant messages using normalized exact matching plus a conservative near-duplicate score. It will also validate narrative grounding against an allowlist of Mira's identity, setting, props, current beat, and committed clues, supplemented by explicit forbidden-world concepts in the generation prompt. The validator will allow intentional repetition when the current user input clearly asks for repetition or clarification.

On the first invalid candidate, generation receives one repair request containing the rejection reason, recent assistant lines, and authoritative story context. A second invalid candidate is not retried recursively; the server selects a deterministic, beat-appropriate fallback with neutral visual directives. Only the final approved candidate proceeds to TTS, scene delivery, or provisional story state.

A bounded server-side gate is preferred over prompt-only prevention because prompts cannot guarantee compliance, and over an unrestricted semantic classifier because false positives could suppress legitimate callbacks. Thresholds and fixtures remain deliberately conservative and testable.

## Risks / Trade-offs

- [Adding a directive version can create mixed-client compatibility issues] → Keep the current segment fields during a transition, define a text-only fallback, and add old/new payload contract tests.
- [More independent visual fields can produce unattractive combinations] → Approve combinations on the server and keep a small curated semantic vocabulary rather than allowing arbitrary composition.
- [Segment-start synchronization can delay visual feedback while media loads] → Preload allowlisted assets after directive receipt, show explicit loading status, but do not reveal the event until presentation starts.
- [Video cleanup differs across browsers] → Use a single media controller boundary, clear sources after pause, and retain physical-device checks for iOS Safari and Android Chrome.
- [Existing CSS names and server enums do not align] → Introduce adapters first and migrate renderers incrementally while preserving current visible behavior.
- [Near-duplicate detection can reject intentional callbacks or common short phrases] → Exempt explicit repeat/clarify intent, ignore very short generic phrases unless exactly repeated in sequence, and cover thresholds with Chinese dialogue fixtures.
- [Strict narrative grounding can make Mira evasive on harmless off-topic questions] → Permit a brief direct acknowledgement, reject only incompatible world-state changes, and require a natural bridge back rather than a canned refusal.

## Migration Plan

1. Introduce the canonical directive schema, generation-quality validator, bounded repair/fallback path, and adapters while preserving existing `performance` output.
2. Add the versioned directive to `response.segment` and update the client to prefer it with a fallback to current fields.
3. Move character and scene rendering to semantic layer state and verify parity for current emotions, actions, lightning, and photo reveal.
4. Add media loading/error/cancellation handling and the video-capable allowlisted renderer boundary.
5. Remove the compatibility payload only after client/server contract and browser acceptance tests pass together.

Rollback keeps the existing `performance` payload and renderer available until the compatibility phase is complete, so the directive path can be disabled without changing dialogue or voice delivery.
