import { describe, expect, it } from "vitest";
import {
  findProductVariantBySelection,
  getDefaultProductVariant,
  getVariantGallery,
  getVariantLabel,
  normalizeProductVariant,
} from "@/lib/product-variants";

describe("normalizeProductVariant", () => {
  it("maps legacy attributes into structured variant fields", () => {
    const variant = normalizeProductVariant({
      sku: "IPHONE-16-PRO-BLK-128",
      attributes: {
        renk: "Siyah",
        hafiza: "128 GB",
        ram: "8 GB",
      },
      price: 89999,
      stock: 4,
    });

    expect(variant.color_name).toBe("Siyah");
    expect(variant.storage).toBe("128 GB");
    expect(variant.ram).toBe("8 GB");
    expect(variant.option_signature).toContain("siyah");
  });
});

describe("variant selection helpers", () => {
  const variants = [
    normalizeProductVariant({
      id: "v1",
      sku: "IPHONE-16-PRO-BLK-128",
      color_name: "Siyah",
      storage: "128 GB",
      price: 89999,
      stock: 0,
      images: ["black-128.png"],
    }),
    normalizeProductVariant({
      id: "v2",
      sku: "IPHONE-16-PRO-BLK-256",
      color_name: "Siyah",
      storage: "256 GB",
      price: 95999,
      stock: 3,
      images: ["black-256.png"],
    }),
  ];

  it("prefers the first active in-stock variant as default", () => {
    expect(getDefaultProductVariant(variants)?.id).toBe("v2");
  });

  it("finds variants by option selection", () => {
    expect(
      findProductVariantBySelection(variants, {
        colorName: "Siyah",
        storage: "256 GB",
      })?.id
    ).toBe("v2");
  });

  it("creates readable labels and respects variant gallery fallback", () => {
    expect(getVariantLabel(variants[1])).toBe("Siyah / 256 GB");
    expect(getVariantGallery(variants[1], ["fallback.png"])).toEqual(["black-256.png"]);
    expect(getVariantGallery(null, ["fallback.png"])).toEqual(["fallback.png"]);
  });
});
