# Design

## Context

The existing scene uses single-layer animated rain, fixed character geometry, and only broad viewport breakpoints. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** improve atmospheric depth, map every specified performance directive to a readable state, and use container-safe CSS composition across mobile sizes.

**Non-Goals:** introduce a new design system, external runtime art dependency, Live2D, or change dialogue semantics.

## Decisions

### Layered CSS atmosphere

Use separate low-cost pseudo-elements for distant rain, foreground rain, glass streaks, mist, reflection, and lightning. This provides depth without media downloads; reduced-motion preferences retain the static composition.

### State-driven visual tokens

Map emotion and action classes to small, composable face, torso, camera, and scene transforms. This is more reliable than one monolithic animation and remains turn-cancellable.

### Viewport tiers

Use compact (<=360px), standard mobile, tall-mobile, tablet, and desktop rules based on available height and width. Preserve control area first, then scale/shift the scene rather than clipping it.

## Risks / Trade-offs

- [Excess animated layers harm low-end phones] -> animate transforms and opacity only, with reduced-motion fallback.
- [More effects obscure content] -> keep subtitle and controls above all atmospheric layers.

## Migration Plan

Ship CSS and renderer changes behind the existing Mock mode, test viewport tiers, then retain the prior scene as the rollback target in source control.
