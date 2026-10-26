import { lazy, Suspense, useEffect, useState } from 'react';
import CharacterScreen from './screens/character/CharacterScreen';
import Home from './screens/Home';
import PictureCardScreen from './screens/PictureCardScreen';
import PhraseScreen from './screens/speak/PhraseScreen';
import SectionScreen from './screens/SectionScreen';
import { SECTIONS, type SectionId } from './sections';

// The playground carries pinyin-pro, so it loads only when opened.
const PinyinScreen = lazy(() => import('./screens/pinyin/PinyinScreen'));
// The game layer carries the scheduler and the database.
const AdventureScreen = lazy(() => import('./practice/AdventureScreen'));
const GardenScreen = lazy(() => import('./practice/GardenScreen'));
const MapScreen = lazy(() => import('./practice/MapScreen'));
const GamesScreen = lazy(() => import('./games/GamesScreen'));

// Screens outside the four sections.
const PAGES = ['today', 'garden', 'map', 'games'] as const;

interface Route {
  section: SectionId | (typeof PAGES)[number] | null;
  char?: string;
}

// The route lives in the URL hash (#/roots, #/roots/好) so the browser back
// button works and the app stays a static site.
function readRoute(): Route {
  const [id, char] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (!SECTIONS.some((s) => s.id === id) && !PAGES.includes(id as (typeof PAGES)[number])) return { section: null };
  return { section: id as Route['section'], char: char ? decodeURIComponent(char) : undefined };
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

  const go = (section: Route['section'], char?: string) => {
    window.location.hash = section ? `/${section}${char ? `/${encodeURIComponent(char)}` : ''}` : '';
  };

  if (route.section === 'today') {
    return (
      <Suspense fallback={null}>
        <AdventureScreen onHome={() => go(null)} />
      </Suspense>
    );
  }
  if (route.section === 'garden') {
    return (
      <Suspense fallback={null}>
        <GardenScreen onHome={() => go(null)} onChar={(c) => go('roots', c)} />
      </Suspense>
    );
  }
  if (route.section === 'games') {
    return (
      <Suspense fallback={null}>
        <GamesScreen onHome={() => go(null)} />
      </Suspense>
    );
  }
  if (route.section === 'map') {
    return (
      <Suspense fallback={null}>
        <MapScreen onHome={() => go(null)} />
      </Suspense>
    );
  }
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
  if (route.section === 'pinyin') {
    return (
      <Suspense fallback={null}>
        <PinyinScreen page={route.char} onHome={() => go(null)} onPage={(p) => go('pinyin', p ?? undefined)} />
      </Suspense>
    );
  }
  if (route.section === 'speak' && route.char) {
    return (
      <PhraseScreen
        key={route.char}
        id={route.char}
        onBack={() => go('speak')}
        onOpen={(id) => go('speak', id)}
        onChar={(c) => go('roots', c)}
      />
    );
  }
  if (route.section === 'pictures' && route.char) {
    return (
      <PictureCardScreen
        key={route.char}
        char={route.char}
        onBack={() => go('pictures')}
        onOpen={(c) => go('pictures', c)}
        onRoots={(c) => go('roots', c)}
      />
    );
  }
  if (route.section) {
    const section: SectionId = route.section;
    return <SectionScreen id={section} onHome={() => go(null)} onOpenChar={(c) => go(section, c)} />;
  }
  return <Home onOpen={go} />;
}
