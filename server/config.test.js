import { describe, expect, it } from "vitest";
import { loadConfig, publicReadiness } from "./config.js";
describe("voice configuration", () => {
  it("defaults to credential-free mock even when a key exists", () =>
    expect(loadConfig({ DASHSCOPE_API_KEY: "secret" }).mode).toBe("mock"));
  it("reports missing live settings without exposing secrets", () => {
    const status = publicReadiness(loadConfig({ VOICE_MODE: "aliyun" }));
    expect(status.ready).toBe(false);
    expect(JSON.stringify(status)).not.toContain("secret");
  });
});
