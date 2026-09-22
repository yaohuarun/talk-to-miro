import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("cinematic scene regression", () => {
  it("keeps layered rain, mist, and reduced-motion support", () => {
    for (const selector of [
      ".rain.far",
      ".rain.near",
      ".mist",
      "prefers-reduced-motion",
    ])
      expect(css).toContain(selector);
  });
  it("maps the required emotional and non-speaking states", () => {
    for (const selector of [
      ".emotion-calm",
      ".emotion-curious",
      ".emotion-guarded",
      ".emotion-vulnerable",
      ".action-look-at-window",
      ".action-adjust-raincoat",
      ".action-hold-camera",
      ".polaroid",
    ])
      expect(css).toContain(selector);
  });
  it("keeps lightning and compact viewport behavior turn-renderable", () => {
    expect(css).toContain(".lightning .window");
    expect(css).toContain("@media(max-width:320px)");
    expect(css).toContain("@media(min-width:390px)");
  });
  it("renders camera, environment, pose, and video layers independently", () => {
    for (const selector of [".camera-slow-push-in .scene", ".environment-lightning-window .window", ".emotion-hesitant", ".pose-softened", ".scene-video", ".action-farewell-nod", ".phase-ended"]) expect(css).toContain(selector);
  });
  it("keeps dialogue in-scene with immersive and landscape fallbacks", () => {
    for (const selector of [
      ".scene-subtitle",
      ".scene:fullscreen",
      ".orientation-hint",
      ".app.landscape:not(.immersive)",
    ])
      expect(css).toContain(selector);
  });
  it("contains portrait and side-drawer composition rules", () => {
    for (const selector of [
      ".conversation-trigger",
      ".conversation-drawer.bottom",
      ".conversation-drawer.side",
      ".drawer-backdrop",
      "@keyframes drawer-up",
    ])
      expect(css).toContain(selector);
  });
  it("reserves a landscape side column only while the drawer is open", () => {
    expect(css).toContain(".app.landscape:not(.immersive).drawer-open");
    expect(css).toContain(
      ".app.landscape:not(.immersive):not(.drawer-open){max-width:none;display:block}",
    );
  });
});
