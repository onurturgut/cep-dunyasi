export const FREE_SHIPPING_THRESHOLD = 750;
export const DEFAULT_SHIPPING_FEE = 89;

export function resolveShippingFee(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SHIPPING_FEE;
  }

  return Math.round(parsed * 100) / 100;
}

export function calculateShippingPrice(subtotal: number, shippingFee: number) {
  const normalizedSubtotal = Math.max(Number(subtotal) || 0, 0);

  if (normalizedSubtotal <= 0) {
    return 0;
  }

  return normalizedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : resolveShippingFee(shippingFee);
}

export function calculateOrderTotals(subtotal: number, discount: number, shippingFee: number) {
  const normalizedSubtotal = Math.max(Number(subtotal) || 0, 0);
  const normalizedDiscount = Math.max(Number(discount) || 0, 0);
  const discountedSubtotal = Math.max(normalizedSubtotal - normalizedDiscount, 0);
  const shippingPrice = calculateShippingPrice(discountedSubtotal, shippingFee);

  return {
    discountedSubtotal,
    shippingPrice,
    finalPrice: discountedSubtotal + shippingPrice,
  };
}
