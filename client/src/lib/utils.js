import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function round(val, decimals = 1) {
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}
