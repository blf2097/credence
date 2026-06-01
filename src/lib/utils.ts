import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatProb(price: string | number): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(0)}%`;
}
