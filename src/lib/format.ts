export function formatUGX(value: number): string {
  return `UGX ${value.toLocaleString('en-UG')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
