import { describe, expect, it } from "vitest";
import { createStorySession, farewellNarrative, isFarewellIntent, selectStoryReply } from "./story.js";

describe("relationship-led Mock story", () => {
  it("does not restart the opening after a warm-drink acknowledgement", () => {
    const session = createStorySession();
    selectStoryReply("是的", session);
    const response = selectStoryReply("多谢", session);
    expect(session.beat).toBe("guarded-inquiry");
    expect(response.text).not.toContain("门铃响的时候");
  });
  it("reveals a clue only from an eligible beat", () => {
    const session = createStorySession();
    selectStoryReply("是的", session);
    selectStoryReply("多谢", session);
    const response = selectStoryReply("你在等谁？", session);
    expect(session.beat).toBe("disclosure");
    expect(session.clues).toContain("waiting-person");
    expect(response.performance.effects).toContain("lightning");
  });
  it("includes a safe Mira presentation cue", () => {
    expect(selectStoryReply("是的", createStorySession()).presentation).toEqual(
      { speaker: "mira" },
    );
  });
  it("recognizes definite departures but not tentative future plans", () => {
    for (const text of ["再见", "我要走了", "要回家了", "下次聊"]) expect(isFarewellIntent(text)).toBe(true);
    for (const text of ["我等下要走", "可能要回家了", "我准备走了"]) expect(isFarewellIntent(text)).toBe(false);
    expect(farewellNarrative({ intimacy: 3 }).segments[0]).toMatchObject({ action: "farewell-nod", endConversation: true, endReason: "user-departure" });
  });
});
