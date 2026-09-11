export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function getPayableInr(originalInr: number) {
  return Math.max(0, originalInr);
}

