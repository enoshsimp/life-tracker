import { useState } from 'react';
import type { AppData, Reward } from '../lib/types';
import { balance } from '../lib/game';
import { appDayKey, getNow, parseKey } from '../lib/day';
import { newId } from '../lib/id';
import { buzz } from '../lib/feedback';
import { AddButton, IconButton, NumberInput, TextInput } from '../components/ui';

/**
 * The reward shop: real-life treats you price in points and buy with your balance.
 * A purchase is a minus line in the ledger, so it lowers your balance but never your level.
 */
export function Shop({ data, update }: { data: AppData; update: (fn: (d: AppData) => AppData) => void }) {
  const [editing, setEditing] = useState(data.settings.rewards.length === 0);
  const points = balance(data);
  const todayKey = appDayKey(getNow(), data.settings.dayStartHour);
  const rewards = data.settings.rewards;
  const purchases = data.ledger.filter((e) => e.kind === 'purchase').sort((a, b) => (a.at < b.at ? 1 : -1));

  const setRewards = (fn: (l: Reward[]) => Reward[]) => update((d) => ({ ...d, settings: { ...d.settings, rewards: fn(d.settings.rewards) } }));
  const patch = (id: string, p: Partial<Reward>) => setRewards((l) => l.map((r) => (r.id === id ? { ...r, ...p } : r)));

  function buy(r: Reward) {
    if (r.cost > points || !window.confirm(`Buy "${r.name}" for ${r.cost} points?`)) return;
    buzz('chest');
    update((d) => ({
      ...d,
      ledger: [
        ...d.ledger,
        { id: newId(), at: new Date().toISOString(), day: todayKey, kind: 'purchase', ref: r.id, amount: -r.cost, label: r.name.trim() },
      ],
    }));
  }

  const undo = (id: string) => {
    buzz('undo');
    update((d) => ({ ...d, ledger: d.ledger.filter((e) => e.id !== id) }));
  };

  const named = rewards.filter((r) => r.name.trim());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Balance</p>
          <p className="text-3xl font-black tabular-nums text-min">{points}</p>
        </div>
        <p className="max-w-[55%] text-right text-xs text-muted">Spending lowers your balance, never your level.</p>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Rewards</h2>
          <button type="button" onClick={() => setEditing(!editing)} className="text-sm font-semibold text-accent">
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-2">
            {rewards.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 pl-3">
                <div className="flex-1">
                  <TextInput value={r.name} onChange={(name) => patch(r.id, { name })} placeholder={`Reward ${i + 1}`} ariaLabel="Reward name" />
                </div>
                <div className="w-28">
                  <NumberInput value={r.cost} min={1} max={100000} onChange={(cost) => patch(r.id, { cost })} ariaLabel="Reward cost" suffix="pts" />
                </div>
                <IconButton label="Delete reward" danger onClick={() => setRewards((l) => l.filter((x) => x.id !== r.id))}>
                  <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
                </IconButton>
              </div>
            ))}
            <AddButton onClick={() => setRewards((l) => [...l, { id: newId(), name: '', cost: 100 }])}>Add a reward</AddButton>
            {rewards.length === 0 && <p className="px-1 text-xs text-muted">Add treats you'd like to earn, and give each one a price in points.</p>}
          </div>
        ) : named.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No rewards yet. Tap Edit to add some.</p>
        ) : (
          <ul className="space-y-2">
            {named.map((r) => {
              const short = r.cost - points;
              return (
                <li key={r.id} className={`flex items-center gap-3 rounded-2xl border bg-surface p-4 ${short > 0 ? 'border-line' : 'border-min/40'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="text-xs text-muted">
                      <span className="font-bold tabular-nums text-text">{r.cost}</span> pts
                      {short > 0 && <span> · {short} more to go</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => buy(r)}
                    disabled={short > 0}
                    aria-label={`Buy ${r.name} for ${r.cost} points`}
                    className="rounded-full bg-min px-4 py-2 text-sm font-bold text-bg active:scale-95 disabled:bg-surface-2 disabled:text-muted"
                  >
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {purchases.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">Bought</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {purchases.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{e.label || 'Reward'}</p>
                  <p className="text-xs text-muted">{parseKey(e.day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* A purchase can be undone on the day it was made, in case of a mis-tap. */}
                  {e.day === todayKey && (
                    <button type="button" onClick={() => undo(e.id)} className="rounded-full px-2 py-1 text-xs text-muted hover:text-text" aria-label={`Undo buying ${e.label}`}>
                      Undo
                    </button>
                  )}
                  <span className="font-black tabular-nums text-red-400">{e.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
