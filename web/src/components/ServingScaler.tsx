import { Users } from 'lucide-react';

interface Props {
  yieldQuantity: number;
  yieldUnit: string | null;
  scale: number;
  onScaleChange: (scale: number) => void;
  yieldDescription?: string | null;
}

export function ServingScaler({ yieldQuantity, yieldUnit, scale, onScaleChange, yieldDescription }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)' }}>
        <Users size={16} style={{ color: 'var(--color-warm-gray)', flexShrink: 0 }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
          Serves {Math.round(yieldQuantity * scale)} {yieldUnit ?? ''}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onScaleChange(Math.max(0.25, +(scale - 0.25).toFixed(2)))}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            −
          </button>
          <span className="text-sm font-medium w-12 text-center" style={{ color: 'var(--color-charcoal)' }}>
            {scale === 1 ? '1×' : `${scale}×`}
          </span>
          <button
            onClick={() => onScaleChange(+(scale + 0.25).toFixed(2))}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            +
          </button>
        </div>
      </div>
      {yieldDescription && (
        <p className="text-xs mt-2 pl-1" style={{ color: 'var(--color-warm-gray)' }}>
          Makes {yieldDescription}
        </p>
      )}
    </div>
  );
}
