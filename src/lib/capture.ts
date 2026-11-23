import type { CaptureTag } from './types';

export const CAPTURE_TAGS: { id: CaptureTag; label: string; className: string }[] = [
  { id: 'idea', label: 'Idea', className: 'text-min border-min/50 bg-min/10' },
  { id: 'task', label: 'Task', className: 'text-accent border-accent/50 bg-accent/10' },
  { id: 'reminder', label: 'Reminder', className: 'text-sky-400 border-sky-400/50 bg-sky-400/10' },
  { id: 'explore', label: 'Explore', className: 'text-pink-400 border-pink-400/50 bg-pink-400/10' },
];

export const tagInfo = (tag: CaptureTag) => CAPTURE_TAGS.find((t) => t.id === tag)!;
