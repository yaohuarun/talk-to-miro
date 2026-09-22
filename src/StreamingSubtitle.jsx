import React, { useEffect, useState } from 'react';

// The parent keys each passage so an interrupted passage cannot keep writing
// into the next one. Speech recognition partials are already streamed upstream.
export function StreamingSubtitle({ text, animate = true }) {
  const [visible, setVisible] = useState('');
  const [reducedMotion, setReducedMotion] = useState(() =>
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference?.addEventListener('change', update);
    return () => preference?.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!animate || reducedMotion) return;
    const characters = Array.from(text);
    let index = 0;
    let timer;
    const reveal = () => {
      index += 1;
      setVisible(characters.slice(0, index).join(''));
      if (index < characters.length) {
        timer = window.setTimeout(reveal, /[，。！？；：、…,.!?;:]/u.test(characters[index - 1]) ? 180 : 45);
      }
    };
    timer = window.setTimeout(reveal, 45);
    return () => window.clearTimeout(timer);
  }, [text, animate, reducedMotion]);

  // Expose the whole passage once to assistive technology, not every letter.
  return <p aria-label={text}><span className="streaming-subtitle-text" aria-hidden="true">{!animate || reducedMotion ? text : visible || '\u00a0'}</span></p>;
}
