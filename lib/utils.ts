import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Round a stock quantity to 2dp. Mirrors the API's inventory-math so
 *  displayed/submitted variances never carry float dust. */
export function roundQty(value: number): number {
  return Number(Number(value).toFixed(2))
}

/** Counted minus expected, rounded — the same variance the API stores. */
export function takeVariance(countedQty: number, expectedQty: number): number {
  return roundQty(countedQty - expectedQty)
}

/** Display a stock quantity at the 2dp policy precision, trimming noise
 *  and trailing zeros (80 stays "80", 260.59999 becomes "260.6"). */
export function formatQty(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return String(parseFloat(Number(value).toFixed(2)))
}
