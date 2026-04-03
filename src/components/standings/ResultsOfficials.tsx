interface ResultsOfficialsProps {
  arbitratorName?: string | null
  organizerName?: string | null
}

export function ResultsOfficials({ arbitratorName, organizerName }: ResultsOfficialsProps) {
  const arbitrator = arbitratorName?.trim()
  const organizer = organizerName?.trim()

  if (!arbitrator && !organizer) return null

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <div className="space-y-1">
        {arbitrator && (
          <p>
            <span className="font-medium text-foreground">Árbitro: </span>
            <span className="text-muted-foreground">{arbitrator}</span>
          </p>
        )}
        {organizer && (
          <p>
            <span className="font-medium text-foreground">Organizador: </span>
            <span className="text-muted-foreground">{organizer}</span>
          </p>
        )}
      </div>
    </div>
  )
}
