# Proposal

## Why

Mira already emits basic dialogue-linked emotions, actions, effects, and story progress, but the contract is split across model output, server-side mappings, and frontend-specific fields. A clearer, fully validated orchestration contract is needed so every accepted reply can drive recognizable, turn-scoped character and scene changes without stale or unsupported directives leaking into the experience.

## What Changes

- Define one canonical, versioned performance directive for dialogue text, emotion/expression, pose or action, camera/environment changes, effects, optional story progression, and image or video events.
- Validate and normalize model- and Mock-generated directives on the server, preserving the text reply while safely dropping unsupported visual fields.
- Make the browser render the approved directive through explicit character, camera, environment, effect, and media lifecycles rather than relying on incidental CSS coupling.
- Synchronize each directive with the originating reply segment and apply it when that segment is actually presented; cancel and clean up all turn-scoped visual state when superseded.
- Keep dialogue- and story-gated events deterministic: photo reveal and disclosure effects depend on current content, clues, or story beat, never a fixed timer.
- Reject verbatim or near-duplicate generated lines against recent accepted dialogue, repair once with explicit context, and use an in-character fallback if generation remains repetitive.
- Keep replies grounded in Mira's established identity, coffee-shop setting, available props, committed clues, and current story beat; acknowledge unrelated user prompts without allowing them to rewrite or derail the narrative world.
- Add contract, orchestration, rendering, interruption, and Mock-mode coverage for at least three recognizable emotions, two non-speaking actions, one environmental or camera change, and one dialogue-triggered visual event.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `narrative-performance-directives`: Clarify the canonical directive contract, normalization rules, segment timing, story gating, repetition prevention, narrative grounding, and turn-scoped cleanup semantics.
- `mira-interactive-scene`: Require explicit rendering and lifecycle feedback for approved character, camera, environment, and media directives.

## Impact

- Server narrative schema, Qwen prompt/response validation and repair, Mock story conversion, recent-response comparison, and conversation coordinator.
- WebSocket response segment payloads and their compatibility/version handling.
- React scene state, directive sanitization, character/camera/effect/media renderers, and interruption cleanup.
- Automated protocol, orchestration, visual-state, and acceptance tests; no new provider dependency is required.
