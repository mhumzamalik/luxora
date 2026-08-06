/**
 * Centralized currency formatter for LUXORA (PKR)
 * Formats amounts as Pakistani Rupees: Rs. 2,999
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}
