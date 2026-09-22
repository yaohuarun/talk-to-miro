# Tasks

## 1. Atmospheric scene system

- [x] 1.1 Replace the single rain treatment with layered distant rain, foreground streaks, glass distortion, mist, and wet reflections, and verify reduced-motion mode remains legible
- [x] 1.2 Add turn-scoped lightning and window illumination layers with camera push-in, and verify the disclosure directive starts and cancels the effect correctly

## 2. Character performance

- [x] 2.1 Map calm, curious, guarded, and vulnerable directives to distinct face and posture states, and verify a state gallery distinguishes all four
- [x] 2.2 Implement look-window, adjust-raincoat, hold-camera, and reveal-photo actions, and verify each directive yields an observable non-speaking cue

## 3. Responsive composition

- [x] 3.1 Add compact, standard, tall-mobile, tablet, and desktop layout tiers, and verify 320px, 375px, 390px, 430px, and desktop viewports have no horizontal overflow
- [x] 3.2 Protect subtitle readability and 44px controls across viewport tiers, and verify with automated layout assertions and browser screenshots

## 4. Polish verification

- [x] 4.1 Add visual and directive regression tests for atmosphere, performance, and interrupted lightning/photo events, and verify `npm test` passes
- [x] 4.2 Run OpenDesign-informed mobile and desktop visual review against the default warm-amber/cool-rain direction, and record findings in the acceptance document
