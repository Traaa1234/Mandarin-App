import CharacterCatch from './CharacterCatch';
import type { GameProps } from './types';

export default function CharacterCatchGame({ index, learned, onDone }: GameProps) {
  return <CharacterCatch chars={learned} index={index} onDone={(score) => onDone(score, 5)} />;
}
