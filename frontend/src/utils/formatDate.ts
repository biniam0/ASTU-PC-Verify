export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(typeof value === 'string' ? new Date(value) : value)
}
