export function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <img
        src="/empty.png"
        alt="Sin torneos"
        className="h-44 w-auto select-none md:h-52"
        loading="lazy"
      />
      <p className="empty-history-text text-muted-foreground text-sm">
        Aún no hay torneos.
      </p>
    </div>
  )
}
