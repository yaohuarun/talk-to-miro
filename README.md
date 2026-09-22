# Mira: Last Light

一个移动端优先的雨夜咖啡馆互动场景 MVP。用户面对的是窗边的 Mira，而不是传统聊天消息列表；Mira 会以语音、画面内字幕、表情、动作与剧情视觉事件回应。

## 本地启动

### 环境准备

- 使用 Node.js 22 和 npm（项目使用 ES Modules）。
- 在项目根目录执行以下命令；Mock 模式不需要数据库、Redis 或云服务密钥。
- 浏览器需支持 WebSocket；Live 语音输入还需要麦克风权限，本机开发请使用 `localhost` 地址。

### 启动 Mock 模式

首次使用时可从 `.env.example` 复制配置。在 Windows PowerShell 中执行以下命令，仅在 `.env` 不存在时创建，避免覆盖已有配置：

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

确认 `.env` 中设置 `VOICE_MODE=mock`，然后安装依赖并启动：

```bash
npm ci
npm run dev
```

打开 Vite 输出的地址（通常为 `http://localhost:5173`）。`npm run dev` 通过 concurrently 同时启动 Vite 前端和 `node server/index.js` 后端；在终端按 `Ctrl+C` 停止。Mock 是默认模式，即使机器上存在百炼密钥也不会自动产生云调用；已有 `.env` 或进程环境变量若设置了 `VOICE_MODE=aliyun`，则会进入 Live 模式。

| 服务 | 本地地址 | 用途 |
| --- | --- | --- |
| 前端 | `http://localhost:5173` | 页面与前端热更新 |
| 后端 | `http://localhost:4174` | Express HTTP API 与 WebSocket 服务，端口在 `server/index.js` 中固定 |
| 就绪检查 | `http://localhost:5173/api/readiness` | 经 Vite 代理检查服务；Mock 正常时返回 `mode: "mock"`、`ready: true` |

`vite.config.js` 将 `/api` 请求代理到后端，并为 `/api/conversation` 启用 WebSocket 代理。需要单独调试时，可在两个终端分别运行 `node server/index.js` 和 `npx vite`。

若前端 5173 端口被占用，Vite 可能自动换端口；请释放该端口，或将实际页面来源加入 `.env` 的 `ALLOWED_ORIGINS`（多个来源以逗号分隔），然后重启后端，否则 WebSocket 连接会被拒绝。修改 `.env` 或后端代码后也需要重启服务。

### 验证与构建

```bash
npm test
node scripts/mock-smoke.mjs
npm run build
```

`npm test` 运行 Vitest 测试；`mock-smoke.mjs` 自行启动临时 Mock 服务并验证一次 WebSocket 对话，无需提前启动开发服务。`npm run build` 只将前端构建到 `dist/`，不会启动或打包 Node 后端。部署时需要单独运行后端，由静态服务器提供 `dist/`，并将 `/api` HTTP 请求及 `/api/conversation` WebSocket 连接转发到后端。

## 系统结构和主要模块

系统由浏览器场景、Node.js 对话服务和可选的百炼模型服务组成。前后端通过同源 `/api/conversation` WebSocket 交换会话、回合、文本、音频和演出指令；开发时由 Vite 完成代理。

```text
浏览器：React 场景 / 输入抽屉 / 字幕 / 音频采集与播放
    │ HTTP /api/readiness + WebSocket /api/conversation
    ▼
Vite 开发代理（部署时由反向代理承担）
    ▼
Node.js：Express + WebSocket
    ├── 配置与就绪检查
    ├── 会话注册、回合编排、取消与剧情状态
    ├── Mock → 本地剧情引擎 → 浏览器语音合成
    └── Live → Paraformer 语音识别 → Qwen 回复生成 → CosyVoice 语音合成
                                      ▲
                               文字输入直接进入回复生成
```

| 目录 / 文件 | 主要职责 |
| --- | --- |
| `src/main.jsx` | React 入口与场景交互，组织角色演出、输入抽屉、沉浸模式和对话状态 |
| `src/StreamingSubtitle.jsx`、`src/styles.css`、`src/drawer.css` | 字幕展示、场景视觉效果及响应式输入布局 |
| `src/conversation-client.js` | 浏览器 WebSocket 客户端，管理连接、会话凭证、回合消息及取消 |
| `src/audio/` | 麦克风采集、PCM 转换、语音活动检测、播放队列及语音意图判断 |
| `src/protocol.js` | 校验演出指令、限制可用媒体和效果，并将事件转换为场景状态 |
| `server/index.js` | 创建 HTTP / WebSocket 服务，注册 API、校验连接来源并接入对话协调器 |
| `server/config.js` | 读取环境配置、设置模型和超时参数，提供不含密钥的就绪信息 |
| `server/conversation/` | `coordinator.js` 编排输入、模型调用、分段输出与取消；`session.js` 管理内存会话及过期清理；`protocol.js` 定义消息结构；`voice-policy.js` 判断语音意图 |
| `server/story.js` | 本地剧情状态与 Mock 回复选择，维护剧情推进、信任和线索 |
| `server/narrative/directives.js` | 规范化和审核叙事结果，将回复转成角色、镜头及环境指令 |
| `server/providers/` | Paraformer、Qwen、CosyVoice 适配器及共享 WebSocket 任务连接逻辑 |
| `scripts/` | Mock / Live 冒烟检查、Live 延迟采样和 Qwen 诊断脚本；Live 脚本需要云服务配置并会调用模型 |
| `docs/` | 功能及语音验收记录；参见 [功能验收](docs/acceptance.md) 和 [语音验收](docs/voice-acceptance.md) |
| `openspec/` | 需求规格、变更设计与实施任务 |

一次对话以 `session`（会话）组织多个 `turn`（回合），每个回复再拆成 `segment`（分段）。服务端校验输入并选择 Mock 或 Live 链路，将台词、音频和演出事件发回浏览器；浏览器按播放进度呈现字幕和场景变化，并发送呈现确认。回合取消及过期事件过滤用于防止旧回复覆盖新输入。

当前会话、历史和剧情状态保存在 Node 进程内存中，默认会话过期时间为 30 分钟（`SESSION_TTL_MS`）。重启后端会丢失这些状态；项目目前没有数据库或持久化存储。

## Mock 剧情体验

Mock 模式维护会话内的剧情节点、信任程度、已揭示线索与当前意图，因此简短回应不会让故事跳回开场。

推荐体验路径：

1. Mira 问“你也被这场雨困住了吗？”时输入“是的”。
2. 她邀请你坐下后输入“多谢”。剧情会自然转到相机与照片，而不会重复门铃问题。
3. 询问照片或相机会触发拿起相机／展示照片。
4. 在进一步交流后询问“你在等谁？”会触发脆弱情绪、望向窗外、闪电和镜头推进。

页面与服务端通过 `/api/conversation` WebSocket 使用统一的 session / turn / segment 协议。旧 `/api/turn` 仅保留为兼容路由。

## 百炼 Live 模式

复制 `.env.example` 为不提交版本库的 `.env`，填写北京地域百炼 API Key，然后明确设置 `VOICE_MODE=aliyun`。默认模型为 `paraformer-realtime-v2`、`qwen-plus`、`cosyvoice-v3-flash`，初始女声音色候选为 `longanhuan`。部署前需在自己的北京工作空间核对模型和音色权限并完成试听。

密钥只由 Node 服务读取，禁止写入 `VITE_*` 变量或浏览器 URL。专属工作空间可将 `DASHSCOPE_WS_URL` 改为控制台提供的 `wss://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/api-ws/v1/inference`。公网环境必须使用同源 HTTPS/WSS；反向代理需要为 `/api/conversation` 转发 Upgrade/Connection 头、关闭响应缓冲并允许至少 120 秒连接。开发代理已支持 WebSocket。

Live 音频输入为单声道 16 kHz signed PCM，TTS 输出为单声道 24 kHz signed PCM。按住说话使用实际麦克风音频；临时识别文字只用于预览，最终识别结果才进入 Qwen。回复按句合成，字幕、表情和动作在音频实际开始播放时触发。新输入会立即停止本地语音并使旧 turn 失效。

`GET /api/readiness` 只返回模式、可用状态、缺失配置名和非敏感模型名，不执行收费请求。Live 配置缺失时页面明确报错，不会伪装成 Mock。用量应分别统计 ASR 音频时长、LLM 输入/输出 token 和 TTS 字符数；价格以所选地域当期账单为准。

## 画面内字幕与沉浸横屏

旁白与 Mira 的台词都位于场景画面的下三分之一：旁白使用低调样式，Mira 的回应带有 `MIRA` 标识。文字与语音输入器保持在场景外，避免遮挡角色。

点击画面右上角的沉浸图标后，应用会在该用户手势中尝试进入全屏并请求横屏。移动浏览器通常不允许页面在未授权时强制旋转，因此如果设备或浏览器拒绝该请求，应用会显示旋转提示，同时保留完整的竖屏体验；不会丢失当前对话或正在播放的回复。

## 抽屉式输入

场景默认只保留“与 Mira 交谈”入口。点击后统一从底部向上弹出输入抽屉；横屏和沉浸模式采用居中窄输入条，不挤压场景。字幕自动避开抽屉，文字输入时根据可视视口贴合软键盘上沿。抽屉内可切换文字和按住说话；只有点击关闭按钮才收起，点击空白处或按 `Esc` 不会关闭。未发送文字会保留，关闭后焦点返回交谈入口。

打开抽屉本身不会打断 Mira。只有发送新的文字，或开始按住说话时，才会取消当前回复并创建新回合；发送成功和 Mira 回复后，抽屉持续显示，便于连续交流。麦克风权限被拒绝时，抽屉会保留并自动切回文字输入，方便立即恢复。

## 语音交互与打断流程

### 用户操作与语音链路

1. 点击“与 Mira 交谈”，在输入抽屉中切换到语音模式。打开抽屉不会打断当前回复。
2. **按住说话即打断当前回复**，页面进入倾听状态，并请求麦克风权限。等待“麦克风已就绪”后开始说话；音频播放解锁与麦克风初始化同时发起。
3. 麦克风就绪后，前端发送 `input.start`，通过 AudioWorklet 采集声音并转换为单声道、16 kHz、16 位 PCM，以带序号的 `input.audio` 消息发送。采集时请求浏览器启用回声消除、降噪和自动增益。
4. 松开按钮后停止录音并发送 `input.end`。Live 模式由 Paraformer 返回最终识别文本；`transcript.partial` 只用于临时字幕预览，最终文本经语音意图判断后才进入回复生成。
5. Qwen 生成台词和演出指令，服务端按分段调用 CosyVoice 合成单声道 24 kHz PCM，通过 `response.segment`、`audio.chunk` 和 `audio.end` 返回结果。
6. 前端收到某段 `audio.end` 后，将该段音频放入顺序播放队列。实际开始播放时同步字幕、表情、动作和媒体，并发送 `segment.started`；播放结束发送 `segment.finished`。正常回复全部完成后收到 `turn.completed`，回到等待状态。

```text
按住 → 取消旧回合 → 麦克风就绪 → input.start → input.audio…
                                                     │
松开 → input.end → 最终识别 → 意图判断 → 回复生成 → 分段语音合成
                                                     │
等待下一次输入 ← turn.completed ← 播放完成确认 ← 音频 / 字幕 / 演出
```

Mock 模式也通过麦克风采集入口演示交互，但服务端不会识别实际音频，也不会调用云模型；松开后使用固定意图“我想知道你为什么还在等。”驱动本地剧情，回复通过浏览器 Speech Synthesis 播放。测试真实识别效果需启用 Live 模式。

### 打断与旧回复隔离

发送非空文字或按下语音按钮时，前端立即递增 `turnId`，停止 PCM 播放和浏览器语音合成、取消正在进行的采集、清空分段队列、移除媒体并重置演出状态，同时向服务端发送旧回合的 `turn.cancel`。语音按下时已有字幕可能暂时保留，随后由识别预览或新回复更新。

服务端将旧回合标记为取消，通过 AbortController 和模型适配器取消接口终止相关任务，并返回 `turn.cancelled`。开始新回合时还会取消此前的活动回合。前端忽略 `turnId` 不匹配的消息，播放器用内部代次使旧播放任务失效；服务端在异步结果返回后再次检查回合有效性，避免迟到结果进入新回合。

| 操作或事件 | 当前行为 |
| --- | --- |
| 打开输入抽屉、切换文字 / 语音输入方式 | 不触发回合取消 |
| 发送非空文字、按下语音按钮 | 立即取消旧回合，开始新输入 |
| 松开语音按钮 | 结束采集并提交当前语音；麦克风未就绪或没有音频帧时提示重试 |
| 语音手势被取消（`pointercancel`） | 取消录音和已启动的语音回合，不提交识别结果 |
| 录音时关闭抽屉 | 停止录音并取消当前回合 |
| 页面进入后台 | 停止采集与播放、清空分段和媒体，并请求取消当前回合 |

### 语音意图判断与当前边界

Live 服务端会发送 `voice.classification`：附和词（如“嗯”“好的”“继续”）归为 `backchannel`，“停一下”“别说了”等明确停止词归为 `interrupt`；空文本和未稳定的短文本归为 `ambiguous`。最终识别为附和时，会发送带 `suppressed: true` 的 `transcript.final` 并取消该输入回合，不调用 Qwen。

当前入口仍是按住说话。VAD 仅在录音期间更新“正在说话 / 等待确认”的提示，不会自动开始录音或在静音后提交；附和识别也不会恢复按下按钮时已经取消的旧回复。因此目前不支持持续免按键监听或附和后的自动续播。

`VITE_REALTIME_INTERRUPTION=false` 可关闭前端收到稳定打断分类时的额外播放器取消操作；它不会关闭按住说话和文字发送触发的打断，也不会关闭服务端附和过滤。修改后需重启 Vite，构建产物需重新构建。页面“语音状态”入口可查看该开关状态、首包耗时和语音诊断信息；首包耗时不等于用户实际听到声音的延迟。

### 异常恢复与对话结束

- 麦克风不可用或权限被拒绝时，抽屉保留并切回文字输入；空音频、未识别到语音或识别超时会提示重试。
- TTS 失败或播放被浏览器阻止时，保留可用台词；存在失败分段时可选择“重试语音”或“仅看文字”。重试只针对该分段，不重新提交整轮输入。
- WebSocket 断开时停止 PCM 播放并清理演出，客户端携带已有会话凭证尝试重连；这不代表旧音频会自动续播。
- 告别回复全部呈现后，服务端发送 `conversation.ended`，页面进入结束状态；点击“重新开始”刷新页面并开启新会话。

## 角色和场景指令的设计

### 角色设定与叙事生成

Mira 的固定设定是 26 岁旅行摄影师，在暴雨后即将打烊的咖啡馆等人，穿琥珀色雨衣、戴银色星星发夹，随身物品为相机、照片和咖啡。Live 模式在 `server/providers/qwen.js` 的系统提示中约束身份、场景和道具，并传入当前剧情状态及最近最多 12 条历史消息，使回复衔接当前线索。

模型输出结构化叙事：`segments` 包含 1–3 段台词，每段带 `text`、`emotion`、`action`、`event`、`clue`，单段台词最多 80 字；`nextBeat` 表示剧情节点。Mock 剧情结果经 `fromStoryResult` 转成相同结构，再由服务端生成统一的场景指令。模型不直接输出 HTML、CSS、可执行脚本或任意媒体地址。

Live 输出先经过 `normalizeNarrative` 规范化，再检查重复台词、部分越界道具和场景偏离；结构或内容审核失败时最多追加一次修复请求，仍不通过则使用当前剧情对应的兜底台词。HTTP 或超时错误通过错误流程返回。这里的审核以结构、关键词和相似度规则为主，不是完整的内容安全系统。

### 指令结构与职责划分

每个 `response.segment` 携带独立的 `directive`，采用 `version: 1`。台词保留在消息的 `text` 字段，指令负责描述本段演出和剧情元数据。

| 字段 | 职责与允许值 |
| --- | --- |
| `character.emotion` | 情绪：`calm`、`curious`、`hesitant`、`vulnerable` |
| `character.expression` | 表情：`open-gaze`、`averted-eyes`、`soft-smile` |
| `character.pose` | 姿态：`neutral`、`attentive`、`guarded`、`softened` |
| `character.action` | 动作：`idle`、`look-at-window`、`adjust-raincoat`、`hold-camera`、`show-photo`、`farewell-nod` |
| `cinematic.camera` | 镜头：`steady`、`slow-push-in`，与角色动作分开表达 |
| `cinematic.environment` | 环境：`rainy-cafe`、`lightning-window`、`warm-lamp-dim` |
| `effects` | 最多 4 项效果：`rain-reflection`、`polaroid-glow`、`lightning`、`warm-lamp-dim` |
| `story` | `nextBeat`、可为空的 `clue`，以及 `endConversation` 和 `endReason`；结束原因为 `user-departure` 或空值 |
| `media` | 最多 1 项媒体，使用注册资源标识；前端允许 `image-reveal` 对应 `polaroid-rainy-street`，`video` 对应 `mira-memory-clip` |

例如，一段讲述等待之人的台词可以携带如下指令（这是 `directive` 对象，不是完整的 WebSocket 消息）：

```json
{
  "version": 1,
  "character": {
    "emotion": "vulnerable",
    "expression": "soft-smile",
    "pose": "softened",
    "action": "look-at-window"
  },
  "cinematic": {
    "camera": "slow-push-in",
    "environment": "lightning-window"
  },
  "effects": ["lightning", "warm-lamp-dim"],
  "story": {
    "nextBeat": "disclosure",
    "clue": "waiting-person",
    "endConversation": false,
    "endReason": null
  },
  "media": []
}
```

### 从叙事意图到画面演出

`server/narrative/directives.js` 将有限的叙事意图映射为确定的演出组合：

- 情绪决定表情和姿态：`vulnerable` 对应 `soft-smile` / `softened`，`hesitant` 对应 `averted-eyes` / `guarded`，`curious` 对应 `open-gaze` / `attentive`，`calm` 对应 `open-gaze` / `neutral`。
- 动作名称在服务端统一，例如叙事层的 `none` 转成 `idle`，`look-window` 转成 `look-at-window`。
- `lightning` 事件组合出镜头缓慢推进、窗外闪电环境及灯光变暗效果；`photo-reveal` 组合出拍立得发光及照片揭示；无特殊事件时使用稳定镜头和雨夜反光。
- Live 的照片揭示须满足台词提到照片 / 相机，或已有 `camera` 线索；闪电须满足台词包含等待相关关键词、处于 `disclosure` 节点或已有 `waiting-person` 线索。不满足时将事件降级为 `none`。

服务端通过 Zod 严格校验生成的指令。前端 `src/protocol.js` 再检查版本和角色、镜头枚举，过滤未注册的效果及媒体类型 / 资源组合；有效指令由 `sceneFromEvent` 转成场景状态，再由 `src/main.jsx` 和样式文件呈现。无效或缺失的指令回退到经过过滤的旧 `performance` 字段，以兼容旧消息。

当前照片揭示使用本地 DOM/CSS。协议虽预留视频类型和资源名，但注册项本身不代表已经提供可播放的视频素材。`nextBeat` 和 `clue` 是有长度限制的字符串，不是封闭枚举；视觉指令的白名单约束与剧情节点约束应分别维护。

### 生效时机、剧情提交与扩展

Live 指令在对应音频真正开始播放时应用；Mock 在收到分段并调用浏览器语音合成时应用。收到生成结果本身不会提交剧情，服务端等待 `segment.finished` 或 `segment.presented` 确认后才记录该段历史、推进节点并加入线索。打断后未完成的分段不会提交；已经确认的分段保留。确认还会检查活动回合和提供的语音重试 `attemptId`，并忽略重复完成确认。

告别由服务端识别离开意图后生成专用叙事和 `farewell-nod` 动作，设置结束标记；全部分段确认完成后才发送 `conversation.ended`。前端以此事件切换结束状态，不依赖场景指令直接关闭对话。

新增角色动作、效果或媒体时，需要同步修改服务端协议枚举、叙事映射、前端白名单与实际渲染，并补充协议和指令测试。若希望模型主动选择新动作，还需更新 Qwen 提示及叙事审核规则；仅增加提示词或资源名不会自动产生新的画面能力。

## 使用的模型、媒体方案和主要第三方服务

### 模型与调用方式

下表记录仓库 `.env.example` 和 `server/config.js` 的默认配置，不代表云平台当前所有可用型号。模型与音色权限需以实际工作空间为准；更换配置后还需验证对应适配器的协议兼容性。

| 能力 | 默认模型 / 方案 | 调用方式与配置 |
| --- | --- | --- |
| Live 语音识别（ASR） | `paraformer-realtime-v2` | Paraformer 适配器通过百炼 WebSocket 接收 16 kHz PCM；由 `ASR_MODEL` 配置 |
| Live 回复生成（LLM） | `qwen-plus` | Qwen 适配器调用兼容接口 `/chat/completions`，请求 JSON，使用 `stream: false`、`enable_thinking: false`；由 `LLM_MODEL` 配置 |
| Live 语音合成（TTS） | `cosyvoice-v3-flash` | CosyVoice 适配器通过百炼 WebSocket 接收合成音频，输出 24 kHz PCM；由 `TTS_MODEL` 配置 |
| Live 音色 | `longanhuan` | 由 `TTS_VOICE` 配置，实际声音需在有权限的工作空间试听 |
| Mock 对话 | 本地剧情规则 | `server/story.js` 选择台词和演出，不调用云模型；语音输入使用固定演示意图 |
| Mock 语音播放 | 浏览器 Speech Synthesis | 设置中文语言及语速，未锁定具体系统音色；声音和可用性依赖浏览器与操作系统 |

Live 的主要外部服务为阿里云百炼（DashScope），三个模型共用服务端的 `DASHSCOPE_API_KEY`。默认语音端点为 `wss://dashscope.aliyuncs.com/api-ws/v1/inference`，LLM 基地址为 `https://dashscope.aliyuncs.com/compatible-mode/v1`，分别可通过 `DASHSCOPE_WS_URL`、`DASHSCOPE_LLM_BASE_URL` 覆盖。项目直接使用 `ws` 和 Node 原生 `fetch` 调用服务，没有引入模型厂商 SDK；兼容接口的使用不表示调用 OpenAI 服务。

### 媒体与浏览器能力

| 内容 | 当前方案 | 边界 |
| --- | --- | --- |
| Mira 与咖啡馆 | React DOM 元素和 CSS 绘制人物、家具、雨幕、灯光；用状态类切换表情、动作及镜头效果 | 没有接入 3D、Live2D 或实时数字人服务；角色表现受现有样式和动作集合限制 |
| 拍立得照片 | 本地 DOM/CSS 绘制 `polaroid-rainy-street`，按指令揭示 | 无需在线图片生成、图片 CDN 或对象存储 |
| 场景视频 | 预留 `mira-memory-clip`，播放器引用 `/media/mira-memory-clip.mp4` | 当前仓库未提供对应 `public/media/mira-memory-clip.mp4`；默认指令映射不生成视频事件，加载失败会移除视频并保留对话 |
| Live 音频 | `getUserMedia` + AudioWorklet 采集，Web Audio 播放 PCM | 依赖麦克风权限、安全上下文与浏览器音频解锁；尚未实现口型级同步 |
| 字幕 | `StreamingSubtitle` 在画面内呈现台词 | 与分段播放起点同步，不使用模型返回的逐字音频时间戳 |
| 字体 | CSS 从 Google Fonts 加载 `DM Mono`、`Noto Serif SC` | 浏览器会访问外部字体服务；网络不可用时回退到 CSS 中的通用字体，排版可能变化 |

当前雨景是视觉动画，未接入独立的雨声或背景音乐音轨，也没有在线图片 / 视频生成服务。Mock 不依赖百炼，但页面字体仍有外部网络依赖，浏览器语音合成也不能统一保证离线可用。

### 主要第三方软件依赖

前端采用 React 19 和 React DOM，开发与构建采用 Vite 6；后端采用 Express 4、`ws`、`cors`、`dotenv`，协议结构由 Zod 4 校验；Vitest 3 用于测试，concurrently 用于同时启动前后端。以上为 `package.json` 中声明的主要版本，实际安装版本由 `package-lock.json` 锁定。这些是项目软件依赖，不是额外的托管服务；当前没有接入数据库、账号服务或媒体存储服务。

## 关键技术选择与取舍

| 选择 | 带来的收益 | 当前代价或限制 |
| --- | --- | --- |
| React + DOM/CSS 场景 | 场景、输入器与字幕共用前端状态，容易实现响应式布局和按回合清理效果 | 不适合复杂骨骼动画、真实口型或高精度人物表演，视觉能力需逐项实现 |
| Node.js 统一代理模型服务 | 密钥留在服务端，集中处理协议、模型调用、超时和取消；前端通过同源 API 访问 | 部署必须运行后端并配置 WebSocket 反向代理，单独托管 `dist/` 无法完成对话 |
| WebSocket 承载 JSON 控制消息和 Base64 音频 | 双向传递音频、识别预览、取消和播放确认，统一会话与回合标识 | Base64 音频约增加三分之一传输体积，并产生编码开销；不是 WebRTC 媒体通道，需要自行处理顺序、重连和回合有效性 |
| ASR → LLM → TTS 分阶段处理 | 每一阶段可以独立替换、诊断和控制，文字输入可跳过 ASR | 多阶段网络和推理耗时叠加；必须等最终识别结果才生成回复 |
| LLM 完整 JSON 输出 + TTS 按段合成播放 | 先校验整份叙事，再把台词、音频和指令绑定到分段，便于重试和同步 | LLM 当前不流式输出；前端等待每段 `audio.end` 后播放该段，因此收到音频首包不等于立即出声 |
| 按住说话作为主要语音入口 | 用户明确控制录音边界和打断时机，降低环境噪音误触发的影响 | 需要持续按住按钮；开始录音即取消旧回复，暂不支持附和后恢复旧音频或免按键双向交谈 |
| 版本化指令与有限枚举 | 把模型意图限制在已实现的角色、镜头和媒体能力内，便于校验、测试及兼容旧协议 | 表现范围有限；新增能力需同步修改模型提示、服务端映射、前端校验和渲染 |
| 播放确认后提交剧情 | 只将已呈现的分段计入历史和线索，避免被打断的未播放内容推进故事 | 依赖客户端确认；连接中断时，已听到但尚未确认的内容可能未提交，未实现完整事件重放 |
| 内存会话与短历史窗口 | 本地启动简单，无需数据库，控制模型上下文规模 | 重启丢失状态，长对话细节可能遗忘；多实例部署需额外设计会话路由或共享状态 |
| 默认 Mock、显式启用 Live | 无密钥即可验证剧情、交互与协议，避免启动时意外调用云模型 | Mock 无法代表真实识别准确率、音色、延迟和云服务稳定性，仍需 Live 与真机验收 |

这些选择优先满足单角色、单场景 MVP 的可运行性和可调试性。若后续目标转向持续语音交流、复杂人物动画或多实例长期会话，需要分别改进音频传输与播放、角色渲染及会话持久化方案。

## 大致投入时间：12小时

## 如果继续开发两周：演进计划

目标是把当前单角色、单场景 MVP 推进到可稳定试用的版本。以下按 10 个工作日安排，是后续计划，不代表已实现或已验收；范围以现有 React / Node.js 架构为基础。

现有 [语音验收记录](docs/voice-acceptance.md) 已包含一次真实服务闭环和 30 轮成功采样，可作为服务链路基线。但脚本记录的首音不能替代浏览器实际出声时间，真实设备的打断耗时、权限与音频解锁仍需补齐验证。

| 时间 | 优先级与工作内容 | 交付与验收方式 |
| --- | --- | --- |
| 第 1–2 天 | P0：统一语音生命周期。将采集、等待识别、生成、播放、取消、结束与重连整理为明确状态转换；从 `src/main.jsx` 拆出语音控制逻辑。重点检查快速按下 / 松开、授权过程中取消、切后台、附和抑制和连接断开的状态恢复 | 形成状态转换说明与故障回归用例；无遗留麦克风采集、卡住的等待态或取消后继续播放的旧音频；断开连接时服务端异步结果不引发异常 |
| 第 3–4 天 | P0：优化真实出声延迟。为 PCM 播放器增加按块缓冲与连续调度，支持在整段合成结束前开始播放；保留整段播放作为回退。同步修正首包、首次调度播放、实际可闻声音的指标口径 | 同条件对比改造前后的至少 30 轮数据，记录 P50 / P95、失败率和缓冲中断；验证块间无明显断裂、分段顺序正确、取消能清掉已排队音频，字幕仍在播放开始时触发 |
| 第 5 天 | P0：完成 Android Chrome 和 iOS Safari 真机验证；覆盖首次授权、拒绝授权、短按、长按、手势取消、扬声器回声、后台恢复和横竖屏 | 更新验收记录并附设备、系统、浏览器和网络条件；为打断设置 pointerdown 到可闻停止 P95 ≤ 200ms 的候选目标，未达到时记录原因并继续优化，不以调用 `stop()` 的时间代替实测 |
| 第 6–7 天 | P1：增强剧情一致性和演出质量。整理剧情节点及线索规则，避免连续重复、过早揭示与告别后继续生成；建立包含简短回应、追问、跑题、重复请求和告别的固定对话集；试听并确认角色音色 | 至少 20 组固定场景可重复回归；自动检查结构、节点和线索，人工评估回应相关性及角色一致性；确认照片、闪电、镜头和字幕在正常播放、打断及仅看文字时的表现 |
| 第 8–9 天 | P1：提供可部署的试用环境。补齐启动与 HTTPS/WSS 代理配置、健康检查和按 session / turn / segment 关联的阶段日志；完善限流、并发上限及云调用用量记录。实现有界的重连状态同步，明确哪些内容已确认、哪些需要重新输入 | 在测试环境完成部署与重启、断网重连、服务超时及配置缺失演练；不重复提交剧情、不自动重放已取消语音；日志不记录密钥，默认不保存原始音频或完整对话文本 |
| 第 10 天 | P0：集中回归和小范围试用。运行自动化、构建、Mock 冒烟及 Live 验收；汇总延迟、失败率、已知问题和回退方式 | 交付可运行版本、验收报告和下一阶段任务；核心链路出现回归时关闭对应实验功能，保留已验证的按住说话与整段播放路径 |

### 实时打断的后续推进方式

第一周先保证按住说话可靠。若核心验收提前完成，再在独立功能开关下试验持续监听：检测到语音时暂缓或降低播放音量，结合稳定识别区分附和与有效插话；确认插话后取消旧回合，附和则恢复原播放。该实验需要新增可恢复的播放位置和服务端输入状态，不能只修改 VAD 阈值或沿用“按下即取消”的路径。

持续监听只有在扬声器回声、安静环境和环境噪声下都通过误触发与漏检评估后才考虑默认开启。两周内若没有足够真机证据，保留实验状态，以按住说话作为正式入口。

### 范围控制与完成标准

两周内优先完成语音生命周期、播放延迟、真机兼容和试用部署。数据库持久化、多实例会话共享、账号体系、WebRTC、3D / Live2D、逐字口型和在线视频生成列为后续候选，不与核心链路改造同时展开。场景素材只补充已能被现有指令可靠驱动、且有明确来源和使用权限的内容。

验收以可复现的结果为准：核心自动化和构建通过；关键真机操作有记录；取消后的旧音频与演出不再出现；音频失败可回退到文字；延迟报告明确测量起止点和环境。Live 复测需要可用账号和调用预算，真机验收需要对应设备；条件未具备的项目保持待验证，不能用 Mock 结果代替。若排期紧张，先缩减持续监听和视觉增强，保证 P0 项完成。

