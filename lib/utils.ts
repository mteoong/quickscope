import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K"
  return num.toFixed(2)
}

export function formatPrice(price: number): string {
  if (price < 0.001) return price.toExponential(3)
  if (price < 1) return price.toFixed(6)
  return price.toFixed(4)
}

export function formatPercentage(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
}
