import { useEffect, useState } from 'react';

// Interim audio: the browser's own Chinese voice, used only when one is installed.
// Native recordings (audio-cmn) replace this in the Speak Mandarin milestone.

function chineseVoice(): SpeechSynthesisVoice | undefined {
  if (typeof speechSynthesis === 'undefined') return undefined;
  return speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith('zh-CN'));
}

export function speak(text: string, rate = 1) {
  const voice = chineseVoice();
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = 'zh-CN';
  u.rate = rate;
  speechSynthesis.speak(u);
}

// Voices load asynchronously in most browsers.
export function useCanSpeak(): boolean {
  const [can, setCan] = useState(() => !!chineseVoice());
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const update = () => setCan(!!chineseVoice());
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return can;
}
