import { useEffect, useState } from 'react';
import CharacterScreen from './screens/character/CharacterScreen';
import Home from './screens/Home';
import SectionScreen from './screens/SectionScreen';
import { SECTIONS, type SectionId } from './sections';

interface Route {
  section: SectionId | null;
  char?: string;
}

// The route lives in the URL hash (#/roots, #/roots/好) so the browser back
// button works and the app stays a static site.
function readRoute(): Route {
  const [id, char] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (!SECTIONS.some((s) => s.id === id)) return { section: null };
  return { section: id as SectionId, char: char ? decodeURIComponent(char) : undefined };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (section: SectionId | null, char?: string) => {
    window.location.hash = section ? `/${section}${char ? `/${encodeURIComponent(char)}` : ''}` : '';
  };

  if (route.section === 'roots' && route.char) {
    return (
      <CharacterScreen
        key={route.char}
        char={route.char}
        onBack={() => go('roots')}
        onOpen={(c) => go('roots', c)}
      />
    );
  }
  if (route.section) {
    return <SectionScreen id={route.section} onHome={() => go(null)} onOpenChar={(c) => go('roots', c)} />;
  }
  return <Home onOpen={go} />;
}
