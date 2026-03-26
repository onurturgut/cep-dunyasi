import { useMemo } from "react";
import {
  getActiveProductVariants,
  normalizeProductVariant,
  type ProductVariantRecord,
} from "@/lib/product-variants";
import { VariantOptionGroup, type VariantOption } from "@/components/product-detail/VariantOptionGroup";

type VariantSelectorProps = {
  variants: ProductVariantRecord[];
  selectedVariant: ProductVariantRecord | null;
  onColorSelect: (value: string) => void;
  onStorageSelect: (value: string) => void;
  onRamSelect: (value: string) => void;
};

function createUniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => `${value ?? ""}`.trim())
        .filter(Boolean),
    ),
  );
}

export function VariantSelector({
  variants,
  selectedVariant,
  onColorSelect,
  onStorageSelect,
  onRamSelect,
}: VariantSelectorProps) {
  const activeVariants = useMemo(
    () => getActiveProductVariants(variants).map((variant) => normalizeProductVariant(variant)),
    [variants],
  );

  const selectedColor = selectedVariant?.color_name || null;
  const selectedStorage = selectedVariant?.storage || null;
  const selectedRam = selectedVariant?.ram || null;

  const colorOptions = useMemo<VariantOption[]>(() => {
    return createUniqueValues(activeVariants.map((variant) => variant.color_name)).map((colorName) => {
      const matchingVariants = activeVariants.filter((variant) => variant.color_name === colorName);
      const referenceVariant = matchingVariants[0];

      return {
        label: colorName,
        value: colorName,
        colorCode: referenceVariant?.color_code || null,
        inStock: matchingVariants.some((variant) => variant.stock > 0),
      };
    });
  }, [activeVariants]);

  const storageOptions = useMemo<VariantOption[]>(() => {
    return createUniqueValues(activeVariants.map((variant) => variant.storage)).map((storage) => {
      const compatibleVariants = activeVariants.filter((variant) => {
        if (selectedColor && variant.color_name !== selectedColor) {
          return false;
        }

        if (selectedRam && (variant.ram || null) !== selectedRam) {
          return false;
        }

        return variant.storage === storage;
      });

      return {
        label: storage,
        value: storage,
        disabled: compatibleVariants.length === 0,
        inStock: compatibleVariants.some((variant) => variant.stock > 0),
      };
    });
  }, [activeVariants, selectedColor, selectedRam]);

  const ramValues = useMemo(
    () => createUniqueValues(activeVariants.map((variant) => variant.ram || "Standart")),
    [activeVariants],
  );

  const ramOptions = useMemo<VariantOption[]>(() => {
    return ramValues.map((ramValue) => {
      const normalizedRam = ramValue === "Standart" ? null : ramValue;
      const compatibleVariants = activeVariants.filter((variant) => {
        if (selectedColor && variant.color_name !== selectedColor) {
          return false;
        }

        if (selectedStorage && variant.storage !== selectedStorage) {
          return false;
        }

        return (variant.ram || null) === normalizedRam;
      });

      return {
        label: ramValue,
        value: ramValue,
        disabled: compatibleVariants.length === 0,
        inStock: compatibleVariants.some((variant) => variant.stock > 0),
      };
    });
  }, [activeVariants, ramValues, selectedColor, selectedStorage]);

  return (
    <div className="space-y-6">
      <VariantOptionGroup
        title="Renk"
        options={colorOptions}
        selectedValue={selectedColor}
        onSelect={onColorSelect}
        style="swatch"
      />

      <VariantOptionGroup
        title="Depolama"
        options={storageOptions}
        selectedValue={selectedStorage}
        onSelect={onStorageSelect}
      />

      {ramOptions.length > 1 ? (
        <VariantOptionGroup
          title="RAM"
          options={ramOptions}
          selectedValue={selectedRam || "Standart"}
          onSelect={onRamSelect}
        />
      ) : null}
    </div>
  );
}
