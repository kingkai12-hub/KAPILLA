import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Single source of truth for the public site origin.
 *
 * Every outbound surface — metadata/SEO, SMS, email, PDF links and QR codes —
 * must build URLs from this so the product never points at two different
 * domains. Override per-environment with NEXT_PUBLIC_APP_URL.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://kapillagroup.vercel.app'
).replace(/\/+$/, '');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
