import { describe, expect, it } from "vitest";
import { calculateCouponDiscount, normalizeCheckoutItems } from "@/server/services/checkout";

describe("normalizeCheckoutItems", () => {
  it("merges duplicate variants and removes invalid rows", () => {
    expect(
      normalizeCheckoutItems([
        { variantId: "v1", quantity: 1 },
        { variantId: "v1", quantity: 2 },
        { variantId: "v2", quantity: 0 },
        { variantId: "", quantity: 1 },
      ])
    ).toEqual([
      { variantId: "v1", quantity: 3 },
    ]);
  });
});

describe("calculateCouponDiscount", () => {
  it("caps percentage discount by order total", () => {
    expect(
      calculateCouponDiscount(1000, {
        id: "c1",
        code: "INDIRIM",
        type: "percentage",
        value: 15,
        is_active: true,
      })
    ).toEqual({ discount: 150, error: null });
  });

  it("returns validation error for expired coupons", () => {
    expect(
      calculateCouponDiscount(1000, {
        id: "c1",
        code: "INDIRIM",
        type: "fixed",
        value: 100,
        is_active: true,
        expires_at: "2000-01-01T00:00:00.000Z",
      }).error
    ).toBe("Kuponun suresi dolmus");
  });
});
