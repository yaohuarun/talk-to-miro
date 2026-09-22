# Proposal

## Why

The always-visible composer competes with the coffee-shop scene and its lower-third dialogue. A contextual drawer keeps the scene quiet until the user chooses to speak, while preserving immediate interruption access.

## What Changes

- Replace the persistent inline composer with a scene-level conversation entry that opens a text-or-voice drawer.
- Use a bottom sheet in every orientation, with a centered compact input bar in landscape and immersive mode, without reserving a side column.
- Keep press-to-talk and text submission available during Mira's response so either action can interrupt it.
- Keep the drawer open across submissions and replies until the user clicks its close button; preserve unsent drafts and restore trigger focus on close.
- Place the conversation trigger near the scene bottom and use the same subtitle styling and position for narration and Mira dialogue, retaining speaker labels.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `mira-interactive-scene`: Define a drawer-based interaction entry while preserving scene-first responsive presentation.
- `interruptible-character-conversation`: Define interruption and recovery behavior when the interaction controls are contained in a drawer.

## Impact

- `src/main.jsx`, `src/styles.css`, `src/drawer.css`, UI regression tests, and README interaction guidance.
