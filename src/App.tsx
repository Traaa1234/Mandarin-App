import { useEffect, useState } from 'react';
import Home from './screens/Home';
import SectionScreen from './screens/SectionScreen';
import { SECTIONS, type SectionId } from './sections';

// The route lives in the URL hash (#/roots) so the browser back button works
// and the app stays a static site.
function readRoute(): SectionId | null {
  const id = window.location.hash.replace(/^#\/?/, '');
  return SECTIONS.some((s) => s.id === id) ? (id as SectionId) : null;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id: SectionId | null) => {
    window.location.hash = id ? `/${id}` : '';
  };

  return route ? <SectionScreen id={route} onHome={() => go(null)} /> : <Home onOpen={go} />;
}
