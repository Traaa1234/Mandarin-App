import { useEffect, useState } from 'react';

// Interim audio: the browser's own voices, used only when one is installed.
// Native recordings (audio-cmn) replace the Chinese voice in the Speak Mandarin milestone.

export type Lang = 'zh-CN' | 'en';

function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  if (typeof speechSynthesis === 'undefined') return undefined;
  return speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(lang));
}

export function speak(text: string, { rate = 1, lang = 'zh-CN' }: { rate?: number; lang?: Lang } = {}) {
  const voice = voiceFor(lang);
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  speechSynthesis.speak(u);
}

// Voices load asynchronously in most browsers.
export function useCanSpeak(lang: Lang = 'zh-CN'): boolean {
  const [can, setCan] = useState(() => !!voiceFor(lang));
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const update = () => setCan(!!voiceFor(lang));
    update();
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, [lang]);
  return can;
}
