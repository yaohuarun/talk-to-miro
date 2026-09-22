# Proposal

## Why

The current Mira MVP establishes the interaction loop but its visual weather, character performance, and small-device composition are too simplified to sustain a cinematic scene-first experience. This change raises visual fidelity while retaining the lightweight, local Mock-mode architecture.

## What Changes

- Introduce layered, depth-aware rain, window distortion, puddle reflection, and lightning treatment.
- Make calm, curious, guarded, and vulnerable expressions and four non-speaking actions visually unambiguous.
- Add responsive scene composition rules for compact, standard, tall, and desktop viewports.
- Refine the default warm-amber/cool-rain visual language and motion hierarchy without creating a separate design system.

## Capabilities

### New Capabilities
- `cinematic-mira-scene-polish`: Define the observable atmospheric fidelity, performance states, and responsive composition expected from the Mira scene.

### Modified Capabilities

- None; the predecessor change has not yet been synchronized into the main spec tree.

## Impact

- Affects the scene renderer, styles, performance directive mapping, local media layers, visual regression checks, and mobile-device acceptance coverage.
