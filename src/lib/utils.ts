import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return '-';
  if (price === 0) return '$0.00';

  let decimals = 2;
  if (price >= 100) decimals = 0;
  else if (price < 0.0001) decimals = 8;
  else if (price < 0.01) decimals = 6;
  else if (price < 1) decimals = 4;

  return `$${price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}
