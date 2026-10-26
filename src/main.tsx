import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Confetti from './components/Confetti';
import PlayTime from './practice/PlayTime';
import { ProfileProvider } from './practice/ProfileContext';
import { SettingsProvider } from './practice/settings';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <ProfileProvider>
        <PlayTime>
          <App />
        </PlayTime>
        <Confetti />
      </ProfileProvider>
    </SettingsProvider>
  </StrictMode>,
);
