import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Grouping is pinned so the header, Stats and Dashboard never disagree by locale
export const formatNumber = (n: number) => n.toLocaleString('en-US')
