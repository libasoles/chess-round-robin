interface PointSelectorProps {
  value: 0 | 0.5 | 1
  onChange: (v: 0 | 0.5 | 1) => void
  label: string
}

const OPTIONS: Array<{ label: string; value: 0 | 0.5 | 1 }> = [
  { label: '0', value: 0 },
  { label: '½', value: 0.5 },
  { label: '1', value: 1 },
]

export function PointSelector({ value, onChange, label }: PointSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              value === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
