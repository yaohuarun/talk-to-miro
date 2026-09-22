# Spec Delta

## Purpose

Make the Mira coffee-shop scene visually legible, atmospheric, and usable across mobile screen sizes while clearly communicating character performance and dialogue-driven environmental events.

## ADDED Requirements

### Requirement: Layered rain atmosphere
The experience SHALL render visibly layered rain with distinct near and far motion, window streaking or distortion, and ground or window reflections without obscuring interaction controls.

#### Scenario: User views the idle coffee-shop scene
- **WHEN** the scene is idle
- **THEN** rain depth, wet-surface reflections, and the warm interior versus cool exterior are visually distinguishable

### Requirement: Recognizable performance vocabulary
The experience SHALL visibly distinguish calm, curious, guarded, and vulnerable Mira presentation, plus looking toward the window, adjusting her raincoat, holding the camera, and revealing a photo.

#### Scenario: Dialogue triggers a directed performance
- **WHEN** an active response contains one of the supported emotions or actions
- **THEN** Mira displays the corresponding expression and physical cue before the turn is complete

### Requirement: Cinematic lightning response
The experience SHALL render a short window-side lightning flash and a camera push-in when the active dialogue directs the disclosure event.

#### Scenario: Mira reveals why she waits
- **WHEN** the waiting-person disclosure is triggered
- **THEN** the environment brightens at the window and the scene framing moves closer to Mira

### Requirement: Adaptive mobile composition
The experience SHALL preserve readable subtitles, 44px minimum interactive targets, and unobscured Mira framing on compact, standard, and tall mobile viewports as well as desktop.

#### Scenario: Compact mobile viewport
- **WHEN** the viewport is 320px wide or narrower
- **THEN** no horizontal scrolling occurs and all primary controls remain reachable

