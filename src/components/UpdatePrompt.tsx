import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * When a new version of the app has been published and downloaded in the background,
 * shows a small bar with an Update button. Your data isn't touched by updating.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a new version every hour while the app stays open.
      if (registration) window.setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-20 mx-auto flex max-w-lg px-4">
      <div role="status" className="flex w-full items-center gap-3 rounded-2xl border border-accent/50 bg-surface-2 p-3 shadow-lg">
        <p className="flex-1 text-sm font-semibold">A new version is ready.</p>
        <button type="button" onClick={() => setNeedRefresh(false)} className="px-2 py-1.5 text-sm font-semibold text-muted">
          Later
        </button>
        <button type="button" onClick={() => void updateServiceWorker(true)} className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-bg">
          Update
        </button>
      </div>
    </div>
  );
}
