import { useMemo } from "react";
import { getProductVariantAxes, type VariantAxisDefinition } from "@/lib/product-variant-config";
import {
  getActiveProductVariants,
  normalizeProductVariant,
  resolveProductVariantBySelection,
  type VariantSelection,
  type ProductVariantRecord,
} from "@/lib/product-variants";
import { VariantOptionGroup, type VariantOption } from "@/components/product-detail/VariantOptionGroup";

type VariantSelectorProps = {
  variants: ProductVariantRecord[];
  selectedValues: VariantSelection;
  categorySlug?: string | null;
  onSelectionChange: (selection: VariantSelection) => void;
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

function getAxisValueFromVariant(variant: ProductVariantRecord, axis: VariantAxisDefinition) {
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

function getSelectedAxisValue(selection: VariantSelection, axis: VariantAxisDefinition) {
  if (axis.fieldKey === "color_name") {
    return selection.colorName || null;
  }

  if (axis.fieldKey === "storage") {
    return selection.storage || null;
  }

  if (axis.fieldKey === "ram") {
    return selection.ram || "Standart";
  }

  return axis.attributeKeys.map((key) => selection.attributes?.[key]).find(Boolean) || null;
}

function buildNextSelection(selection: VariantSelection, axis: VariantAxisDefinition, value: string): VariantSelection {
  if (axis.fieldKey === "color_name") {
    return { ...selection, colorName: value };
  }

  if (axis.fieldKey === "storage") {
    return { ...selection, storage: value };
  }

  if (axis.fieldKey === "ram") {
    return { ...selection, ram: value };
  }

  return {
    ...selection,
    attributes: {
      ...(selection.attributes || {}),
      [axis.attributeKeys[0]]: value,
    },
  };
}

export function VariantSelector({
  variants,
  selectedValues,
  categorySlug,
  onSelectionChange,
}: VariantSelectorProps) {
  const activeVariants = useMemo(
    () => getActiveProductVariants(variants).map((variant) => normalizeProductVariant(variant)),
    [variants],
  );

  const axisDefinitions = useMemo(() => getProductVariantAxes(categorySlug), [categorySlug]);

  const optionGroups = useMemo(() => {
    const selectedAxisValues = Object.fromEntries(
      axisDefinitions.map((axis) => [axis.id, getSelectedAxisValue(selectedValues, axis)]),
    );

    return axisDefinitions
      .map((axis) => {
        const optionValues = createUniqueValues(activeVariants.map((variant) => getAxisValueFromVariant(variant, axis)));

        const options = optionValues.map<ResolvedVariantOption>((value) => {
          const candidates = activeVariants.filter((variant) => getAxisValueFromVariant(variant, axis) === value);
          const preferredVariant = resolveProductVariantBySelection(
            activeVariants,
            buildNextSelection(selectedValues, axis, value),
            categorySlug,
          );

          return {
            label: value,
            value,
            colorCode: axis.id === "color_name" ? preferredVariant?.color_code || null : null,
            disabled: candidates.length === 0,
            inStock: candidates.some((candidate) => candidate.stock > 0),
            preferredVariantId: preferredVariant?.id || null,
          };
        });

        return {
          axis,
          selectedValue: selectedAxisValues[axis.id],
          options,
        };
      })
      .filter((group) => group.options.length > 1);
  }, [activeVariants, axisDefinitions, categorySlug, selectedValues]);

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
          onSelect={(value) => onSelectionChange(buildNextSelection(selectedValues, group.axis, value))}
          style={group.axis.style === "swatch" ? "swatch" : "pill"}
        />
      ))}
    </div>
  );
}
