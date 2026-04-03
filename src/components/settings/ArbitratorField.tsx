import { Input } from '@/components/ui/input'

interface ArbitratorFieldProps {
  value: string
  onChange: (v: string) => void
}

export function ArbitratorField({ value, onChange }: ArbitratorFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="arbitrator-name"
        className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide"
      >
        Árbitro (opcional)
      </label>
      <Input
        id="arbitrator-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="María Gómez"
        className="text-base h-12"
      />
      {!value.trim() && (
        <p className="text-xs text-muted-foreground">
          Se usará como nombre de árbitro por default
        </p>
      )}
    </div>
  )
}
