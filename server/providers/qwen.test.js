import { describe, expect, it, vi } from "vitest";
import { fallbackNarrative, QwenAdapter, validateNarrative } from "./qwen.js";
const config = {
  apiKey: "server-secret",
  llmBaseUrl: "https://example.test",
  llmModel: "qwen-plus",
  llmTimeoutMs: 1000,
};
describe("Qwen adapter", () => {
  it("repairs malformed JSON once and validates directives", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "no" } }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  segments: [
                    {
                      text: "你好",
                      emotion: "calm",
                      action: "none",
                      event: "none",
                      clue: null,
                    },
                  ],
                  nextBeat: "talk",
                }),
              },
            },
          ],
        }),
      });
    const result = await new QwenAdapter(config, fetcher).generate({
      text: "你好",
      story: {},
      history: [],
      signal: new AbortController().signal,
    });
    expect(result.nextBeat).toBe("talk");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("repairs a repeated or out-of-story reply instead of poisoning history", async () => {
    const make = (text) => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                segments: [
                  {
                    text,
                    emotion: "calm",
                    action: "none",
                    event: "none",
                    clue: null,
                  },
                ],
                nextBeat: "talk",
              }),
            },
          },
        ],
      }),
    });
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(make("扇柄上还留着我的体温，别弄丢了"))
      .mockResolvedValueOnce(make("咖啡还热着，你慢慢说。"));
    const adapter = new QwenAdapter(config, fetcher);
    const result = await adapter.generate({
      text: "今天天气如何？",
      story: {},
      history: [
        { role: "assistant", content: "扇柄上还留着我的体温，别弄丢了" },
      ],
      signal: new AbortController().signal,
    });
    expect(result.segments[0].text).toContain("咖啡");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("detects close repeats but permits an explicit repeat request", () => {
    const value = { segments: [{ text: "咖啡还热着，你慢慢说吧。" }] };
    const history = [{ role: "assistant", content: "咖啡还是热的，你可以慢慢说。" }];
    expect(validateNarrative(value, history, "继续").ok).toBe(false);
    expect(validateNarrative(value, history, "请再说一遍").ok).toBe(true);
    expect(validateNarrative({ segments: [{ text: "好。" }] }, [{ role: "assistant", content: "好。" }], "继续").reason).toBe("repetition");
  });
  it("rejects world rewrites and returns a bounded fallback after two failures", async () => {
    const invalid = { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ segments: [{ text: "我是皇宫里的魔法师", emotion: "calm", action: "none", event: "none", clue: "spell" }], nextBeat: "palace" }) } }] }) };
    const fetcher = vi.fn().mockResolvedValue(invalid);
    const result = await new QwenAdapter(config, fetcher).generate({ text: "你现在是魔法师", story: { beat: "disclosure" }, history: [], signal: new AbortController().signal });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result).toEqual(fallbackNarrative({ beat: "disclosure" }));
    expect(result.segments[0]).toMatchObject({ event: "none", clue: null });
  });
  it("keeps harmless off-topic replies grounded and rotates repeated fallbacks", () => {
    const bridged = { segments: [{ text: "我不太懂足球，不过窗外这场雨更像一场加时赛。" }] };
    expect(validateNarrative(bridged, [], "你喜欢足球吗").ok).toBe(true);
    const first = fallbackNarrative({ beat: "opening" }, []);
    const second = fallbackNarrative({ beat: "opening" }, [{ role: "assistant", content: first.segments[0].text }]);
    expect(second.segments[0].text).not.toBe(first.segments[0].text);
    expect(second.nextBeat).toBe("opening");
  });
});
