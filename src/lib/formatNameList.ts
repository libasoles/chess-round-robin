export function formatNameList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`

  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}
