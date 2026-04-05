import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from '@/lib/utils'

type SliderProps = {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  marks?: boolean
  className?: string
}

function Slider({ value, onValueChange, min = 0, max = 100, step = 1, disabled, marks, className }: SliderProps) {
  const tickValues = marks
    ? Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step)
    : []

  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'relative touch-none select-none',
        marks ? 'flex flex-col w-full' : 'flex w-full items-center',
        disabled && 'opacity-40 pointer-events-none',
        className,
      )}
    >
      <SliderPrimitive.Control className="relative flex w-full cursor-pointer items-center py-2">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
          <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary/50 bg-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Control>

      {marks && tickValues.length > 0 && (
        <div className="relative h-2 w-full">
          {tickValues.map((tick) => (
            <span
              key={tick}
              className={cn(
                'absolute top-0 block h-1.5 w-0.5 -translate-x-1/2 rounded-full',
                tick <= value ? 'bg-primary/50' : 'bg-border',
              )}
              style={{ left: `${((tick - min) / (max - min)) * 100}%` }}
            />
          ))}
        </div>
      )}
    </SliderPrimitive.Root>
  )
}

export { Slider }
