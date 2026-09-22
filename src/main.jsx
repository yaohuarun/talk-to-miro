import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './drawer.css';
import { sanitizePresentation, sceneFromEvent } from './protocol.js';
import { ConversationClient } from './conversation-client.js';
import { PcmCapture } from './audio/capture.js';
import { PcmPlayer } from './audio/player.js';

const initial = { emotion: 'calm', expression: 'open-gaze', action: 'idle', camera: 'steady', effects: [], media: [] };
const labels = { idle: 'Mira 正在等雨停', listening: 'Mira 正在倾听', thinking: 'Mira 在想如何回答', speaking: 'Mira 正在说话', ended: '本次对话已结束', error: '连接暂时中断' };
const openingNarration = '暴雨后的夜晚，打烊提示牌已经亮起。Mira 抱着相机站在窗边，目光一次次落向门口——她似乎还在等一个人。';
const eventPerformance = (event) => { const scene = sceneFromEvent(event); return { ...initial, ...scene.character, ...scene.cinematic, effects: scene.effects, media: scene.media }; };
const encodePcm = (pcm) => { const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength); let binary = ''; for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]); return btoa(binary); };

function App() {
  const [phase, setPhase] = useState('idle');
  const [input, setInput] = useState('');
  const [subtitle, setSubtitle] = useState(openingNarration);
  const [presentation, setPresentation] = useState({ speaker: 'narrator' });
  const [performance, setPerformance] = useState(initial);
  const [notice, setNotice] = useState('Mock mode · 无需 API 密钥');
  const [media, setMedia] = useState(null);
  const [inputMode, setInputMode] = useState('text');
  const [recording, setRecording] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [landscape, setLandscape] = useState(() => window.matchMedia?.('(orientation: landscape)').matches);
  const [orientationHint, setOrientationHint] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [failedSegment, setFailedSegment] = useState(null);
  const [ended, setEnded] = useState(false);
  const active = useRef(0), client = useRef(null), capture = useRef(null), player = useRef(null), segments = useRef(new Map()), sequence = useRef(0), sceneRef = useRef(null), triggerRef = useRef(null), textInputRef = useRef(null), appRef = useRef(null), drawerRef = useRef(null);

  const closeDrawer = () => { if (recording) { capture.current?.cancel(); client.current?.send({ type: 'turn.cancel', turnId: active.current }); setRecording(false); setPhase('idle'); } setDrawerOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const openDrawer = () => { setDrawerOpen(true); };
  const cancel = (next = 'idle') => {
    const oldTurn = active.current; active.current += 1; player.current?.cancel(); capture.current?.cancel(); window.speechSynthesis?.cancel(); segments.current.clear();
    if (oldTurn) client.current?.send({ type: 'turn.cancel', turnId: oldTurn });
    setRecording(false); setFailedSegment(null); setMedia(null); setPerformance(initial); setPhase(next);
  };

  const submit = (value) => {
    const text = value.trim(); if (!text || ended) return;
    cancel('thinking'); const turnId = active.current; setInput(''); setMedia(null);
    setSubtitle('Mira 低头想了想……'); setPresentation({ speaker: 'mira' });
    client.current?.send({ type: 'input.text', turnId, text });
  };

  const startVoice = async () => {
    if (ended) return;
    cancel('listening'); const turnId = active.current; setRecording(true); setNotice('松开即可发送；此操作会打断 Mira'); sequence.current = 0;
    player.current?.unlock(); client.current?.send({ type: 'input.start', turnId, format: 'pcm_s16le', sampleRate: 16000, channels: 1 });
    const recorder = new PcmCapture((pcm) => { if (recording || active.current === turnId) client.current?.send({ type: 'input.audio', turnId, sequence: sequence.current++, data: encodePcm(pcm) }); }); capture.current = recorder;
    try { await recorder.start(); if (active.current !== turnId) await recorder.cancel(); }
    catch (error) { if (error.name !== 'AbortError') { setRecording(false); setPhase('idle'); setInputMode('text'); setNotice('无法使用麦克风，请检查权限或改用文字。'); setDrawerOpen(true); } }
  };
  const endVoice = async () => {
    if (!recording) return;
    setRecording(false); const turnId = active.current; await capture.current?.stop(); client.current?.send({ type: 'input.end', turnId }); setPhase('thinking'); setSubtitle('Mira 侧耳听着雨声里的话……');
  };
  const cancelVoice = async () => { if (!recording) return; setRecording(false); await capture.current?.cancel(); client.current?.send({ type: 'turn.cancel', turnId: active.current }); setPhase('idle'); setNotice('录音已取消，没有发送。'); };
  const enterImmersive = async () => {
    setImmersive(true); setOrientationHint('');
    try {
      if (appRef.current?.requestFullscreen && !document.fullscreenElement) await appRef.current.requestFullscreen();
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
      else setOrientationHint('横屏由设备控制；旋转手机可获得更沉浸的画面。');
    } catch { setOrientationHint('无法自动横屏；旋转手机仍可继续体验。'); }
  };

  useEffect(() => {
    const reflow = () => { setLandscape(Boolean(window.matchMedia?.('(orientation: landscape)').matches)); setImmersive(Boolean(document.fullscreenElement)); };
    const hide = () => { if (document.hidden) { capture.current?.cancel(); player.current?.cancel(); window.speechSynthesis?.cancel(); segments.current.clear(); if (active.current) client.current?.send({ type: 'turn.cancel', turnId: active.current }); setRecording(false); setMedia(null); setPerformance(initial); setPhase('idle'); } };
    window.addEventListener('resize', reflow); window.addEventListener('orientationchange', reflow); document.addEventListener('fullscreenchange', reflow);
    document.addEventListener('visibilitychange', hide);
    const handleEvent = (event) => {
      if (event.type === 'session.ready') { setNotice(`${event.mode === 'aliyun' ? 'Live' : 'Mock'} mode · ${event.ready ? '语音服务已就绪' : '配置不完整'}`); return; }
      if (event.turnId && event.turnId !== active.current) return;
      if (event.type === 'transcript.partial') { setSubtitle(`你：${event.text}`); setPresentation({ speaker: 'narrator' }); return; }
      if (event.type === 'transcript.final') { setSubtitle('Mira 低头想了想……'); setPresentation({ speaker: 'mira' }); setPhase('thinking'); return; }
      if (event.type === 'response.segment') {
        segments.current.set(event.segmentId, event); if (event.mockAudio) {
          const nextPerformance = eventPerformance(event); setPerformance(nextPerformance); setMedia(nextPerformance.media[0] ? { ...nextPerformance.media[0], turnId: event.turnId, segmentId: event.segmentId } : null); setSubtitle(event.text); setPresentation(sanitizePresentation(event.presentation)); setPhase('speaking');
          client.current?.send({ type: 'segment.started', turnId: event.turnId, segmentId: event.segmentId });
          if (window.speechSynthesis) { const utterance = new SpeechSynthesisUtterance(event.text); utterance.lang = 'zh-CN'; utterance.rate = 0.92; utterance.onend = () => client.current?.send({ type: 'segment.finished', turnId: event.turnId, segmentId: event.segmentId }); utterance.onerror = utterance.onend; window.speechSynthesis.speak(utterance); }
          else client.current?.send({ type: 'segment.presented', turnId: event.turnId, segmentId: event.segmentId });
        } return;
      }
      if (event.type === 'audio.chunk') { player.current?.addChunk(event); return; }
      if (event.type === 'audio.end') { player.current?.finish(event).catch(() => { const segment = segments.current.get(event.segmentId); setFailedSegment(segment ? { ...segment, attemptId: event.attemptId } : null); setPhase('error'); setNotice('浏览器阻止了语音播放，请重试语音或阅读文字。'); }); return; }
      if (event.type === 'turn.completed') { setPhase('idle'); setMedia(null); return; }
      if (event.type === 'conversation.ended') { setEnded(true); setPhase('ended'); setMedia(null); setNotice('Mira 已向你道别。本次对话结束，可以重新开始。'); return; }
      if (event.type === 'turn.error') { const segment = event.segmentId ? segments.current.get(event.segmentId) : null; if (segment) { setSubtitle(segment.text); setPresentation({ speaker: 'mira' }); setPerformance(initial); setMedia(null); setFailedSegment(segment); } const message = event.stage === 'tts' ? '语音暂不可用，可阅读回复或重试语音。' : event.stage === 'configuration' ? 'Live 模式配置不完整，请检查服务端环境变量。' : event.code === 'empty_speech' ? '没有听清，请再说一次或改用文字。' : '连接暂时中断，请重试。'; setPhase('error'); setNotice(message); setDrawerOpen(true); }
    };
    player.current = new PcmPlayer({ onStart: (event) => { const segment = segments.current.get(event.segmentId); if (!segment || event.turnId !== active.current) return; setFailedSegment(null); const nextPerformance = eventPerformance(segment); setPerformance(nextPerformance); setMedia(nextPerformance.media[0] ? { ...nextPerformance.media[0], turnId: event.turnId, segmentId: event.segmentId } : null); setSubtitle(segment.text); setPresentation(sanitizePresentation(segment.presentation)); setPhase('speaking'); client.current?.send({ type: 'segment.started', turnId: event.turnId, segmentId: event.segmentId, attemptId: event.attemptId }); }, onFinish: (event) => client.current?.send({ type: 'segment.finished', turnId: event.turnId, segmentId: event.segmentId, attemptId: event.attemptId }), onBlocked: () => setNotice('点击页面后可继续播放 Mira 的语音。') });
    client.current = new ConversationClient({ onEvent: handleEvent, onDisconnect: () => { player.current?.cancel(); segments.current.clear(); setMedia(null); setPerformance(initial); setPhase('error'); setNotice('连接已断开，刷新后将开启新会话。'); } }).connect();
    return () => { window.removeEventListener('resize', reflow); window.removeEventListener('orientationchange', reflow); document.removeEventListener('fullscreenchange', reflow); document.removeEventListener('visibilitychange', hide); player.current?.cancel(); capture.current?.cancel(); client.current?.close(); };
  }, []);
  useEffect(() => { if (drawerOpen && inputMode === 'text') window.setTimeout(() => textInputRef.current?.focus(), 0); }, [drawerOpen, inputMode]);

  useEffect(() => {
    if (!drawerOpen) { sceneRef.current?.style.removeProperty('--subtitle-clearance'); return; }
    const viewport = window.visualViewport;
    const position = () => {
      const inset = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      drawerRef.current?.style.setProperty('--keyboard-inset', `${inset}px`);
      const panel = drawerRef.current?.getBoundingClientRect();
      const scene = sceneRef.current?.getBoundingClientRect();
      if (panel && scene) sceneRef.current.style.setProperty('--subtitle-clearance', `${Math.max(16, scene.bottom - panel.top + 12)}px`);
    };
    const observer = new ResizeObserver(position);
    if (drawerRef.current) observer.observe(drawerRef.current);
    position();
    const settle = window.setTimeout(position, 240);
    viewport?.addEventListener('resize', position); viewport?.addEventListener('scroll', position);
    window.addEventListener('resize', position);
    return () => { observer.disconnect(); clearTimeout(settle); viewport?.removeEventListener('resize', position); viewport?.removeEventListener('scroll', position); window.removeEventListener('resize', position); };
  }, [drawerOpen]);

  const drawerPlacement = 'bottom';
  return <main ref={appRef} className={`app phase-${phase} emotion-${performance.emotion} expression-${performance.expression} pose-${performance.pose || 'neutral'} action-${performance.action} camera-${performance.camera} environment-${performance.environment || 'rainy-cafe'} ${performance.effects.join(' ')} ${immersive ? 'immersive' : ''} ${landscape ? 'landscape' : 'portrait'} ${drawerOpen ? 'drawer-open' : ''}`}>
    <header><span>RAINY NIGHT · 23:47</span><span className="state" aria-live="polite">{labels[phase]}</span></header>
    <section ref={sceneRef} className="scene" aria-label="雨夜即将打烊的咖啡馆场景">
      <div className="rain far" /><div className="rain near" /><div className="mist" /><div className="window"><i /><i /><i /></div><div className="lamp"><i /><b /></div>
      <div className="closing-sign"><strong>CLOSING SOON</strong><small>LAST ORDER · 23:50</small></div><div className="chair one" /><div className="chair two" /><div className="chair three" /><div className="counter" /><div className="last-cup"><i /><i /><b /></div>
      <div className="mira" aria-label={`Mira：${performance.emotion}，${performance.action}`}><span className="hair" /><span className="star">✦</span><span className="face"><i className="brow left" /><i className="brow right" /><b className="eye left" /><b className="eye right" /><em className="mouth" /></span><span className="coat" /><span className="camera" /></div>
      {media?.type === 'image-reveal' && <div className="polaroid" role="status" aria-label="场景图片已显示"><div className="photo-art" /><small>雨夜的路灯 · 还没送出的照片</small></div>}{media?.type === 'video' && <video className="scene-video" autoPlay muted playsInline src="/media/mira-memory-clip.mp4" onLoadStart={() => setNotice('场景视频加载中…')} onError={() => { const key = `${media.turnId}:${media.segmentId}`; setMedia((current) => `${current?.turnId}:${current?.segmentId}` === key ? null : current); setNotice('场景视频加载失败，仍可继续阅读或收听回复。'); }} onEnded={() => { const key = `${media.turnId}:${media.segmentId}`; setMedia((current) => `${current?.turnId}:${current?.segmentId}` === key ? null : current); }} />}{performance.effects.includes('lightning') && <div className="flash" />}
      <div className="scene-subtitle narrator" data-speaker={presentation.speaker} aria-live="polite"><span>{presentation.speaker === 'narrator' ? '旁白' : 'MIRA'}</span><p>{subtitle}</p></div>
      <button type="button" className="immersive-trigger" onClick={enterImmersive} aria-label="进入沉浸横屏">⌗ <span>沉浸</span></button>
      {ended ? <button ref={triggerRef} type="button" className="conversation-trigger" onClick={() => window.location.reload()}>重新开始 <span aria-hidden="true">↑</span></button> : <button ref={triggerRef} type="button" className="conversation-trigger" onClick={openDrawer} aria-expanded={drawerOpen} aria-controls="conversation-drawer">与 Mira 交谈 <span aria-hidden="true">↑</span></button>}
    </section>
    {orientationHint && <p className="orientation-hint" role="status">{orientationHint}</p>}
    <p className="status-line" aria-live="polite">{notice}</p>
    {drawerOpen && <><div className="drawer-backdrop" aria-hidden="true" /><aside ref={drawerRef} id="conversation-drawer" className={`conversation-drawer ${drawerPlacement}`} role="dialog" aria-label="与 Mira 交谈">
      <div className="drawer-handle" aria-hidden="true" /><button className="drawer-close" type="button" onClick={closeDrawer} aria-label="关闭输入抽屉">×</button>
      {ended ? <button type="button" className="restart-conversation" onClick={() => window.location.reload()}>重新开始对话</button> : <form className={`composer ${inputMode}`} onSubmit={(event) => { event.preventDefault(); if (inputMode === 'text') submit(input); }}>
        <button type="button" className="mode-toggle" onClick={() => setInputMode(inputMode === 'text' ? 'voice' : 'text')} aria-label="切换输入方式"><span className={`mode-icon ${inputMode === 'text' ? 'microphone' : 'keyboard'}`} aria-hidden="true" /></button>
        {inputMode === 'text' ? <><input ref={textInputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="对 Mira 说点什么……" aria-label="对 Mira 说什么" /><button type="submit">发送</button></> : <button type="button" className={recording ? 'voice-hold active' : 'voice-hold'} onPointerDown={startVoice} onPointerUp={endVoice} onPointerCancel={cancelVoice} aria-label="按住说话">{recording ? '松开发送' : '按住说话'}</button>}
      </form>}
      {phase === 'error' && <div className="drawer-helper" role="status"><span>{notice}</span>{failedSegment && <span className="speech-recovery"><button type="button" onClick={() => { setFailedSegment(null); setPhase('thinking'); client.current?.send({ type: 'segment.retry', turnId: failedSegment.turnId, segmentId: failedSegment.segmentId, attemptId: failedSegment.attemptId }); }}>重试语音</button><button type="button" onClick={() => { client.current?.send({ type: 'segment.presented', turnId: failedSegment.turnId, segmentId: failedSegment.segmentId }); setFailedSegment(null); setPhase('idle'); }}>仅看文字</button></span>}</div>}
    </aside></>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
