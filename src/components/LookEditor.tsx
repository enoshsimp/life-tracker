import type { AppData, Settings } from '../lib/types';
import { ALL_COSMETICS, unlockedCosmetics, type Cosmetic } from '../lib/cosmetics';
import { BadgeIcon } from './Celebrations';
import { Toggle } from './ui';

/** Colour theme, badge style (both found in daily chests) and the sound and vibration switches. */
export function LookEditor({ data, onChange }: { data: AppData; onChange: (fn: (s: Settings) => Settings) => void }) {
  const s = data.settings;
  const owned = unlockedCosmetics(data);
  const choose = (c: Cosmetic) => onChange((x) => ({ ...x, cosmetics: { ...x.cosmetics, [c.kind]: c.value } }));
  const lockedCount = ALL_COSMETICS.filter((c) => !owned.has(c.id)).length;

  const Picker = ({ kind }: { kind: Cosmetic['kind'] }) => (
    <div className="grid grid-cols-3 gap-2">
      {ALL_COSMETICS.filter((c) => c.kind === kind).map((c) => {
        const have = owned.has(c.id);
        const on = s.cosmetics[kind] === c.value;
        return (
          <button
            key={c.id}
            type="button"
            disabled={!have}
            onClick={() => choose(c)}
            aria-pressed={on}
            aria-label={have ? `${c.name} ${kind === 'theme' ? 'theme' : 'badge style'}` : `${c.name}: locked, found in daily chests`}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-colors ${
              on ? 'border-accent bg-surface-2' : 'border-line'
            } ${have ? '' : 'opacity-35'}`}
          >
            {kind === 'theme' ? (
              <span className="h-7 w-7 rounded-full" style={{ background: have ? c.swatch : 'var(--color-surface-2)' }} />
            ) : (
              <span className={`grid h-7 w-7 place-items-center rounded-full ${have ? 'bg-min text-bg' : 'bg-surface-2 text-muted'}`}>
                <BadgeIcon className="h-4 w-4" shape={c.value} />
              </span>
            )}
            {have ? c.name : 'Locked'}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Colour theme</span>
        <Picker kind="theme" />
      </div>
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Badge style</span>
        <Picker kind="badge" />
      </div>
      {lockedCount > 0 && <p className="text-xs text-muted">{lockedCount} more to find in daily chests.</p>}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="font-semibold">Sounds</p>
          <p className="text-xs text-muted">Little sounds when you tick and celebrate</p>
        </div>
        <Toggle label="Sounds" on={s.sound} onChange={(sound) => onChange((x) => ({ ...x, sound }))} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Vibration</p>
          <p className="text-xs text-muted">Works on Android; iPhones don't allow it</p>
        </div>
        <Toggle label="Vibration" on={s.haptics} onChange={(haptics) => onChange((x) => ({ ...x, haptics }))} />
      </div>
    </div>
  );
}
