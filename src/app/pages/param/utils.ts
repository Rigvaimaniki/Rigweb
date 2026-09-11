export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function getDiscountInr(originalInr: number, discountPercent: number) {
  return Math.round((originalInr * discountPercent) / 100);
}

export function getPayableInr(originalInr: number, discountPercent: number) {
  return Math.max(0, originalInr - getDiscountInr(originalInr, discountPercent));
}

