import { useMemo } from "react";
import { getProductVariantAxes, type VariantAxisDefinition } from "@/lib/product-variant-config";
import {
  getActiveProductVariants,
  normalizeProductVariant,
  type ProductVariantRecord,
} from "@/lib/product-variants";
import { VariantOptionGroup, type VariantOption } from "@/components/product-detail/VariantOptionGroup";

type VariantSelectorProps = {
  variants: ProductVariantRecord[];
  selectedVariant: ProductVariantRecord | null;
  categorySlug?: string | null;
  onVariantSelect: (variant: ProductVariantRecord | null) => void;
};

type ResolvedVariantOption = VariantOption & {
  preferredVariantId: string | null;
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

function getSelectedAxisValue(variant: ProductVariantRecord | null, axis: VariantAxisDefinition) {
  if (!variant) {
    return null;
  }

  if (axis.fieldKey === "color_name") {
    return variant.color_name;
  }

  if (axis.fieldKey === "storage") {
    return variant.storage;
  }

  if (axis.fieldKey === "ram") {
    return variant.ram || "Standart";
  }

  return axis.attributeKeys.map((key) => variant.attributes[key]).find(Boolean) || null;
}

export function VariantSelector({
  variants,
  selectedVariant,
  categorySlug,
  onVariantSelect,
}: VariantSelectorProps) {
  const activeVariants = useMemo(
    () => getActiveProductVariants(variants).map((variant) => normalizeProductVariant(variant)),
    [variants],
  );

  const axisDefinitions = useMemo(() => getProductVariantAxes(categorySlug), [categorySlug]);

  const optionGroups = useMemo(() => {
    const selectedValues = Object.fromEntries(
      axisDefinitions.map((axis) => [axis.id, getSelectedAxisValue(selectedVariant, axis)]),
    );

    return axisDefinitions
      .map((axis) => {
        const optionValues = createUniqueValues(activeVariants.map((variant) => getSelectedAxisValue(variant, axis)));

        const options = optionValues.map<ResolvedVariantOption>((value) => {
          const candidates = activeVariants
            .filter((variant) => getSelectedAxisValue(variant, axis) === value)
            .map((variant) => {
              const score = axisDefinitions.reduce((total, candidateAxis) => {
                if (candidateAxis.id === axis.id) {
                  return total;
                }

                const currentValue = selectedValues[candidateAxis.id];
                if (!currentValue) {
                  return total;
                }

                return getSelectedAxisValue(variant, candidateAxis) === currentValue ? total + 1 : total;
              }, 0);

              return { variant, score };
            })
            .sort((left, right) => {
              if ((right.variant.stock > 0 ? 1 : 0) !== (left.variant.stock > 0 ? 1 : 0)) {
                return (right.variant.stock > 0 ? 1 : 0) - (left.variant.stock > 0 ? 1 : 0);
              }

              if (right.score !== left.score) {
                return right.score - left.score;
              }

              return left.variant.sort_order - right.variant.sort_order;
            });

          const preferredVariant = candidates[0]?.variant ?? null;

          return {
            label: value,
            value,
            colorCode: axis.id === "color_name" ? preferredVariant?.color_code || null : null,
            disabled: candidates.length === 0,
            inStock: candidates.some((candidate) => candidate.variant.stock > 0),
            preferredVariantId: preferredVariant?.id || null,
          };
        });

        return {
          axis,
          selectedValue: selectedValues[axis.id],
          options,
        };
      })
      .filter((group) => group.options.length > 1);
  }, [activeVariants, axisDefinitions, selectedVariant]);

  if (optionGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {optionGroups.map((group) => (
        <VariantOptionGroup
          key={group.axis.id}
          title={group.axis.label}
          options={group.options}
          selectedValue={group.selectedValue}
          onSelect={(value) => {
            const nextOption = group.options.find((option) => option.value === value);
            const nextVariant = activeVariants.find((variant) => variant.id === nextOption?.preferredVariantId) || null;
            onVariantSelect(nextVariant);
          }}
          style={group.axis.style === "swatch" ? "swatch" : "pill"}
        />
      ))}
    </div>
  );
}
