// Currency code to symbol mapping
const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BDT: "৳",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  HKD: "HK$",
  SGD: "S$",
  SEK: "kr",
  KRW: "₩",
  NOK: "kr",
  NZD: "NZ$",
  MXN: "MX$",
  TWD: "NT$",
  ZAR: "R",
  BRL: "R$",
  DKK: "kr",
  PLN: "zł",
  THB: "฿",
  IDR: "Rp",
  HUF: "Ft",
  CZK: "Kč",
  ILS: "₪",
  CLP: "CLP$",
  PHP: "₱",
  AED: "د.إ",
  COP: "COL$",
  SAR: "﷼",
  MYR: "RM",
  RON: "lei",
  VND: "₫",
  PKR: "₨",
  NGN: "₦",
  EGP: "E£",
  TRY: "₺",
  RUB: "₽",
  UAH: "₴",
};

/**
 * Get the currency symbol for a given currency code
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "BDT", "EUR")
 * @returns The currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currencyCode?: string | null): string {
  if (!currencyCode) return "$";
  return currencySymbols[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format a budget amount with the appropriate currency symbol
 * @param amount - The budget amount
 * @param currencyCode - ISO 4217 currency code
 * @returns Formatted string like "$100" or "৳100"
 */
export function formatBudget(
  amount: number,
  currencyCode?: string | null,
): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount}`;
}
