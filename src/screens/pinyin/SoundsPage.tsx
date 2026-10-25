import { useState } from 'react';
import { playKey } from '../../lib/audio';
import { content } from './content';
import { SoundTile } from './ui';

// Every initial and final as a tile that plays its recording.
export default function SoundsPage() {
  const [active, setActive] = useState<string | null>(null);

  const press = (id: string, say: string) => {
    setActive(id);
    playKey(say).then(() => setActive((a) => (a === id ? null : a)));
  };

  return (
    <div className="flex flex-col gap-7">
      {content.groups.map((group) => (
        <section key={group.id} aria-label={group.title}>
          <h2 className="mb-2 text-sm font-bold text-ink/60">{group.title}</h2>
          <div className="flex flex-col gap-2">
            {group.rows.map((row, r) => (
              <div key={r} className="flex flex-wrap gap-2">
                {row.map((tile) => {
                  const id = `${group.id}-${tile.label}`;
                  return (
                    <SoundTile
                      key={id}
                      label={tile.label}
                      active={active === id}
                      onPress={() => press(id, tile.say)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
