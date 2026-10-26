import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import CharacterScreen from './screens/character/CharacterScreen';
import Home from './screens/Home';
import PictureCardScreen from './screens/PictureCardScreen';
import PhraseScreen from './screens/speak/PhraseScreen';
import SectionScreen from './screens/SectionScreen';
import { SECTIONS, type SectionId } from './sections';

// The playground carries pinyin-pro, and the game layer the scheduler and the
// database, so they load only when opened.
const PinyinScreen = lazy(() => import('./screens/pinyin/PinyinScreen'));
const AdventureScreen = lazy(() => import('./practice/AdventureScreen'));
const GardenScreen = lazy(() => import('./practice/GardenScreen'));
const MapScreen = lazy(() => import('./practice/MapScreen'));
const GamesScreen = lazy(() => import('./games/GamesScreen'));
const AlbumScreen = lazy(() => import('./practice/AlbumScreen'));
const ShopScreen = lazy(() => import('./practice/ShopScreen'));
const ParentScreen = lazy(() => import('./practice/ParentScreen'));
const FestivalScreen = lazy(() => import('./practice/FestivalScreen'));
const TeachScreen = lazy(() => import('./practice/TeachScreen'));
const CertificateScreen = lazy(() => import('./practice/CertificateScreen'));

// Screens outside the four sections.
const PAGES = ['today', 'garden', 'map', 'games', 'album', 'shop', 'parents', 'festival', 'teach', 'certificate'] as const;
type Page = (typeof PAGES)[number];

interface Route {
  section: SectionId | Page | null;
  char?: string;
}

// The route lives in the URL hash (#/roots, #/roots/好) so the browser back
// button works and the app stays a static site.
function readRoute(): Route {
  const [id, char] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (!SECTIONS.some((s) => s.id === id) && !PAGES.includes(id as Page)) return { section: null };
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
  const home = () => go(null);
  const roots = (c: string) => go('roots', c);
  const lazyScreen = (screen: ReactNode) => <Suspense fallback={null}>{screen}</Suspense>;

  switch (route.section) {
    case null:
      return <Home onOpen={go} />;
    case 'today':
      return lazyScreen(<AdventureScreen onHome={home} onTeach={() => go('teach')} />);
    case 'garden':
      return lazyScreen(<GardenScreen onHome={home} onChar={roots} />);
    case 'map':
      return lazyScreen(<MapScreen onHome={home} onCertificate={(id) => go('certificate', String(id))} />);
    case 'games':
      return lazyScreen(<GamesScreen onHome={home} />);
    case 'album':
      return lazyScreen(<AlbumScreen onHome={home} />);
    case 'shop':
      return lazyScreen(<ShopScreen onHome={home} />);
    case 'parents':
      return lazyScreen(<ParentScreen onHome={home} />);
    case 'festival':
      return lazyScreen(<FestivalScreen onHome={home} onChar={roots} />);
    case 'teach':
      return lazyScreen(<TeachScreen onHome={home} />);
    case 'certificate':
      return lazyScreen(<CertificateScreen islandId={Number(route.char)} onBack={() => go('map')} />);
    case 'pinyin':
      return lazyScreen(<PinyinScreen page={route.char} onHome={home} onPage={(p) => go('pinyin', p ?? undefined)} />);
  }

  if (route.section === 'roots' && route.char) {
    return <CharacterScreen key={route.char} char={route.char} onBack={() => go('roots')} onOpen={roots} />;
  }
  if (route.section === 'speak' && route.char) {
    return <PhraseScreen key={route.char} id={route.char} onBack={() => go('speak')} onOpen={(id) => go('speak', id)} onChar={roots} />;
  }
  if (route.section === 'pictures' && route.char) {
    return (
      <PictureCardScreen key={route.char} char={route.char} onBack={() => go('pictures')} onOpen={(c) => go('pictures', c)} onRoots={roots} />
    );
  }
  const section: SectionId = route.section;
  return <SectionScreen id={section} onHome={home} onOpenChar={(c) => go(section, c)} />;
}
