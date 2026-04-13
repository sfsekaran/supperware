import { type Step } from '../lib/recipeUtils';

interface Props {
  steps: Step[];
  checkedSteps: Set<number>;
  onToggle: (id: number) => void;
}

export function StepList({ steps, checkedSteps, onToggle }: Props) {
  const groups: { name: string | null; items: Step[] }[] = [];
  for (const step of steps) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== step.section_name) {
      groups.push({ name: step.section_name, items: [step] });
    } else {
      last.items.push(step);
    }
  }

  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi} className="mb-6">
          {group.name && (
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-warm-gray)' }}>
              {group.name}
            </p>
          )}
          <div className="space-y-3">
            {group.items.map((step) => {
              const checked = checkedSteps.has(step.id);
              const globalIdx = steps.indexOf(step) + 1;
              return (
                <button
                  key={step.id}
                  onClick={() => onToggle(step.id)}
                  className="flex items-start gap-4 text-left w-full p-4 rounded-xl transition-all"
                  style={{
                    background: checked ? '#e8f0e5' : 'white',
                    border: `1.5px solid ${checked ? 'var(--color-sage-light)' : 'var(--color-border)'}`,
                    cursor: 'pointer',
                    opacity: checked ? 0.6 : 1,
                  }}
                >
                  <span
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ background: checked ? 'var(--color-sage)' : 'var(--color-cream-dark)', color: checked ? 'white' : 'var(--color-warm-gray)' }}>
                    {checked ? '✓' : globalIdx}
                  </span>
                  <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--color-charcoal)', textDecoration: checked ? 'line-through' : 'none', margin: 0 }}>
                    {step.instruction}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
