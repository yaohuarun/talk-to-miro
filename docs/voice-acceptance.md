# 语音链路验收记录

## 已完成：无凭证验证

- 模式：Mock（默认，不发起百炼请求）
- 自动化（2026-09-22）：29 项通过；覆盖协议、配置、会话隔离、过期 turn、音频边界、剧情延迟提交、Qwen JSON 修复、TTS 失败重试与 PCM 重采样。后续新增测试需重新记录总数。
- 构建（2026-09-22）：`npm run build` 通过。
- Mock WebSocket 冒烟（2026-09-22）：`session.ready → response.segment → segment.presented → turn.completed` 通过。
- 安全检查（2026-09-22）：前端源码与构建产物未匹配 `DASHSCOPE_API_KEY` 或 `Bearer `。

## 待执行：百炼 Live

- [x] 2026-09-22 验证北京地域配置；模型为 `paraformer-realtime-v2` / `qwen-plus` / `cosyvoice-v3-flash`，配置音色 `longanhuan`。
- [x] 独立验证 Paraformer、Qwen、CosyVoice 请求；一次闭环烟测成功，LLM 3900ms、完整 TTS 3395ms、ASR 5425ms（ASR 包含按实时速度投喂约 4.7 秒测试音频）。
- [x] 30 轮真实服务采样：30/30 成功。松手到首音 P50 2255ms、P95 2443ms、最小 2006ms、最大 2690ms。阶段 P50：ASR 最终结果 289ms、LLM 1414ms、TTS 首音 562ms。测试音频预先生成，识别音频在松手前完成投喂；三路并发、当前网络与账号结果不代表供应商 SLA。
- [x] 基准前出现一次 `llm_invalid_json`；收紧完整 JSON 字段提示后，正式 30 轮为 0 次失败。自动化已验证“是的 → 多谢”不回到开场，未播放线索不进入历史。
- [ ] 由用户人耳确认 `longanhuan` 是否符合 Mira 克制、温暖的角色感觉；兼容与成功合成已经验证，人耳审美尚未代替用户判断。
- [ ] 在真实浏览器播放期间测量 pointerdown 到可闻停止的耗时；服务端采样不能替代本地音频设备测量。

## 待执行：真机

- [ ] Android Chrome：权限、按压滑出、键盘、横竖屏、切后台、打断
- [ ] iOS Safari：权限、音频解锁、键盘、横竖屏、切后台、打断

没有真实凭证或设备结果时，不得勾选以上待执行项或声称达到延迟目标。
