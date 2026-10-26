import type { DataIndex } from '../data/types';

export interface GameProps {
  index: DataIndex;
  // Characters the child has learned, in learning order. Games use only these.
  learned: string[];
  profileId: number;
  // score out of max; the host turns it into stars and seeds.
  onDone: (score: number, max: number) => void;
}
