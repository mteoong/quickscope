import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  const safeNum = Number(num ?? 0)
  if (isNaN(safeNum)) return "0.00"
  if (safeNum >= 1e9) return (safeNum / 1e9).toFixed(2) + "B"
  if (safeNum >= 1e6) return (safeNum / 1e6).toFixed(2) + "M"
  if (safeNum >= 1e3) return (safeNum / 1e3).toFixed(2) + "K"
  return safeNum.toFixed(2)
}

export function formatPrice(price: number): string {
  const safePrice = Number(price ?? 0)
  if (isNaN(safePrice)) return "0.0000"
  if (safePrice < 0.001) return safePrice.toExponential(3)
  if (safePrice < 1) return safePrice.toFixed(6)
  return safePrice.toFixed(4)
}

export function formatPercentage(pct: number): string {
  const safePct = Number(pct ?? 0)
  if (isNaN(safePct)) return "+0.00%"
  return `${safePct >= 0 ? "+" : ""}${safePct.toFixed(2)}%`
}
