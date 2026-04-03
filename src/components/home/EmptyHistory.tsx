export function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img
        src="/empty.png"
        alt="Sin torneos"
        className="mb-4 h-28 w-auto select-none"
        loading="lazy"
      />
      <p className="text-muted-foreground text-sm">
        Aún no hay torneos. ¡Crea uno nuevo para empezar!
      </p>
    </div>
  )
}
