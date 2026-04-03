import { Input } from '@/components/ui/input'

interface ArbitratorFieldProps {
  value: string
  onChange: (v: string) => void
}

export function ArbitratorField({ value, onChange }: ArbitratorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Input
        id="arbitrator-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Juan Pérez (opcional)"
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
