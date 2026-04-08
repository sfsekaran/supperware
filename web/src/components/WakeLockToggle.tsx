import { Moon } from 'lucide-react';

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function WakeLockToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors"
      style={{
        background: enabled ? 'var(--color-sage)' : 'var(--color-cream-dark)',
        color: enabled ? 'white' : 'var(--color-warm-gray)',
        border: '1px solid',
        borderColor: enabled ? 'var(--color-sage)' : 'var(--color-border)',
        cursor: 'pointer',
      }}
      title={enabled ? 'Screen will stay on — tap to turn off' : 'Tap to keep screen on while cooking'}
    >
      <Moon size={11} />
      {enabled ? 'Screen on' : 'Keep screen on'}
    </button>
  );
}
