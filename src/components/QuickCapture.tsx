import { useEffect, useRef, useState } from 'react';
import type { CaptureTag } from '../lib/types';
import { CAPTURE_TAGS } from '../lib/capture';
import { buzz } from '../lib/feedback';

/** The raised + button that sits in the middle of the bottom bar. */
export function CaptureButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Quick capture"
      className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-accent text-bg shadow-lg shadow-black/50 ring-4 ring-bg active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

/** The one-line capture sheet, plus a short "Saved to Inbox" confirmation. */
export function CaptureSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (text: string, tag?: CaptureTag) => void;
}) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState<CaptureTag | undefined>();
  const [toast, setToast] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(0), 1600);
    return () => window.clearTimeout(id);
  }, [toast]);

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed, tag);
    buzz('min');
    setText('');
    setTag(undefined);
    onClose();
    setToast((n) => n + 1);
  }

  return (
    <>
      {toast > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center">
          <span key={toast} className="animate-pop rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-full shadow-lg">
            Saved to Inbox
          </span>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/60" onClick={onClose}>
          <form
            role="dialog"
            aria-label="Quick capture"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="mx-auto w-full max-w-lg space-y-3 rounded-t-3xl border-t border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Quick capture</p>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              aria-label="Capture text"
              enterKeyHint="done"
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-3 text-base outline-none placeholder:text-muted/70 focus:border-accent"
            />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tag (optional)">
              {CAPTURE_TAGS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tag === t.id}
                  // Keep the cursor in the text box, so the phone keyboard stays open and Enter still saves.
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setTag(tag === t.id ? undefined : t.id);
                    inputRef.current?.focus();
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tag === t.id ? t.className : 'border-line text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-line px-5 py-3 font-semibold text-muted">
                Cancel
              </button>
              <button type="submit" disabled={!text.trim()} className="flex-1 rounded-full bg-accent py-3 font-bold text-bg disabled:opacity-40">
                Save to Inbox
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
