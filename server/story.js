const directive = (emotion, action, extra = {}) => ({
  version: 1,
  emotion,
  expression:
    emotion === "vulnerable"
      ? "soft-smile"
      : emotion === "guarded"
        ? "averted-eyes"
        : "open-gaze",
  action,
  camera: extra.camera || "steady",
  effects: extra.effects || [],
  media: extra.media || [],
  storyFlags: extra.storyFlags || [],
});

export function createStorySession() {
  return { beat: "opening", intimacy: 0, clues: [], recentIntent: "arrival" };
}

const has = (text, pattern) => pattern.test(text);
export function isFarewellIntent(input) {
  const text = String(input || "").trim().toLowerCase();
  if (/等下|待会|一会儿|可能|也许|准备|快要/.test(text)) return false;
  return /^(?:再见|拜拜|bye|goodbye|我(?:要|该|先)?走了|我?要回家了|我先回家了|先走了|下次(?:再)?聊)(?:[，。！!～~\s]|谢谢|晚安)*$/i.test(text);
}
export function farewellNarrative(story = {}) {
  const intimate = Number(story.intimacy || 0) >= 3;
  return { segments: [{ text: intimate ? "好，路上小心。雨已经小了一些，但别走得太急。谢谢你陪我等了这么久。" : "好，路上小心。雨还没完全停，走到屋檐外时别太急。", emotion: "calm", action: "farewell-nod", event: "none", clue: null, endConversation: true, endReason: "user-departure" }], nextBeat: "farewell" };
}
const addClue = (session, clue) => {
  if (!session.clues.includes(clue)) session.clues.push(clue);
};
function intentOf(text) {
  if (has(text, /照片|photo|相机|camera/i)) return "photo";
  if (has(text, /等谁|为什么等|谁会来|等的人|why|who/i)) return "waiting";
  if (has(text, /雨|rain/i)) return "rain";
  if (has(text, /多谢|谢谢|谢了|不用客气|thanks|thank you/i))
    return "acknowledgement";
  if (has(text, /^(是的|嗯|对|是|yes|yeah|yep)[。！!?\s]*$/i))
    return "affirmation";
  return "conversation";
}
const result = (text, performance, presentation = { speaker: "mira" }) => ({
  text,
  performance,
  presentation,
});

export function selectStoryReply(input, rawSession) {
  const session = rawSession || createStorySession();
  if (!session.beat) Object.assign(session, createStorySession(), session);
  const text = String(input || "").toLowerCase();
  if (has(text, /timeout|超时/i)) return { error: "模拟网络超时，请重试。" };
  const intent = intentOf(text);
  session.recentIntent = intent;
  if (session.beat === "opening") {
    if (intent === "affirmation") {
      session.beat = "shared-shelter";
      session.intimacy = 1;
      addClue(session, "rain");
      return result(
        "那我们算是同一场雨的临时同盟了。你先坐吧，我刚好还留着一杯热的。",
        directive("warm", "soften-posture", {
          effects: ["rain-reflection"],
          storyFlags: ["rapport-started"],
        }),
      );
    }
    if (intent === "photo") {
      session.beat = "guarded-inquiry";
      session.intimacy = 1;
      addClue(session, "camera");
      return result(
        "这台相机陪我走过很多城市。今晚它一直没有被我收进包里。",
        directive("curious", "hold-camera", {
          effects: ["polaroid-glow"],
          storyFlags: ["camera-noticed"],
        }),
      );
    }
    return result(
      "门铃响的时候，我还以为是风。你也被这场雨困住了吗？",
      directive("calm", "idle", { effects: ["rain-reflection"] }),
    );
  }
  if (session.beat === "shared-shelter") {
    if (intent === "acknowledgement" || intent === "conversation") {
      session.beat = "guarded-inquiry";
      session.intimacy = 2;
      return result(
        "不用客气。雨把人留在这里，也让人暂时不用急着解释自己。你会把最舍不得的一张照片带在身边吗？",
        directive("curious", "hold-camera", {
          effects: ["rain-reflection"],
          storyFlags: ["guarded-inquiry-started"],
        }),
      );
    }
    if (intent === "photo") {
      session.beat = "guarded-inquiry";
      session.intimacy = 2;
      addClue(session, "photo");
      return result(
        "想看吗？这张照片拍的是雨停前的街口。我总觉得它比我更清楚，有些人会不会回来。",
        directive("curious", "show-photo", {
          media: [{ type: "image-reveal", asset: "polaroid-rainy-street" }],
          effects: ["polaroid-glow"],
          storyFlags: ["photo-revealed"],
        }),
      );
    }
    session.beat = "guarded-inquiry";
  }
  if (session.beat === "guarded-inquiry") {
    if (intent === "waiting") {
      session.beat = "disclosure";
      session.intimacy = 3;
      addClue(session, "waiting-person");
      return result(
        "我在等一个答应会回来取照片的人。雨停以后，他总会站在那盏路灯下面。",
        directive("vulnerable", "look-at-window", {
          camera: "slow-push-in",
          effects: ["lightning", "warm-lamp-dim"],
          storyFlags: ["waiting-person-revealed"],
        }),
      );
    }
    if (intent === "photo") {
      addClue(session, "photo");
      return result(
        "这一张还没送出去。你看，雨水把路灯拉成了很长的光——像有人正在往回走。",
        directive("curious", "show-photo", {
          media: [{ type: "image-reveal", asset: "polaroid-rainy-street" }],
          effects: ["polaroid-glow"],
          storyFlags: ["photo-revealed"],
        }),
      );
    }
    if (intent === "rain")
      return result(
        "暴雨把最后一班车也冲散了。幸好这家店还亮着，像一张没有冲洗完的底片。",
        directive("guarded", "adjust-raincoat", {
          effects: ["rain-reflection"],
        }),
      );
    return result(
      "我总觉得，照片替人记住了那些没来得及说出口的话。窗外那盏灯下面，也有一张。",
      directive("guarded", "look-at-window", { effects: ["warm-lamp-dim"] }),
    );
  }
  if (session.beat === "disclosure") {
    session.beat = "resolution";
    session.intimacy = 4;
    return result(
      "谢谢你没有急着替我下结论。再陪我等到咖啡凉一点，好吗？",
      directive("warm", "soften-posture", { storyFlags: ["quiet-ending"] }),
    );
  }
  return result(
    "雨声小了一点。也许有些答案，不必在今晚全部说完。",
    directive("calm", "idle", {
      effects: ["rain-reflection"],
      storyFlags: ["quiet-afterword"],
    }),
  );
}
