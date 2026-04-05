import {
  type CatalogSubcategoryOption,
  getCatalogVariantOptions,
  matchesCatalogFilters,
  type CatalogFilterProfile,
  type CatalogFilters,
  type CatalogProductRecord,
} from "@/lib/product-catalog";
import {
  SECOND_HAND_BATTERY_BUCKETS,
  SECOND_HAND_CONDITION_OPTIONS,
  SECOND_HAND_WARRANTY_OPTIONS,
} from "@/lib/second-hand";

export type CatalogFacetOption = {
  value: string;
  label: string;
};

export type CatalogFacetSectionData = {
  id: string;
  title: string;
  options: CatalogFacetOption[];
  selectedValues: string[];
};

type BuildCatalogFacetSectionsInput = {
  filters: CatalogFilters;
  filterProfile: CatalogFilterProfile;
  isSecondHandIphoneCategory: boolean;
  products: CatalogProductRecord[];
  availableSubcategories: CatalogSubcategoryOption[];
  searchFilteredProducts: CatalogProductRecord[];
};

export function buildCatalogFacetSectionsData({
  filters,
  filterProfile,
  isSecondHandIphoneCategory,
  products,
  availableSubcategories,
  searchFilteredProducts,
}: BuildCatalogFacetSectionsInput): CatalogFacetSectionData[] {
  const catalogOptions = getCatalogVariantOptions(products, filterProfile);
  const sections: CatalogFacetSectionData[] = [];
  const matchCache = new Map<string, boolean>();

  const hasMatchingProducts = (nextFilters: CatalogFilters) => {
    const cacheKey = JSON.stringify(nextFilters);
    const cached = matchCache.get(cacheKey);

    if (cached != null) {
      return cached;
    }

    const hasMatch = searchFilteredProducts.some((product) => matchesCatalogFilters(product, nextFilters, filterProfile));
    matchCache.set(cacheKey, hasMatch);
    return hasMatch;
  };

  const buildFacetOptions = (
    options: Array<{ value: string; label: string }>,
    nextFilters: (value: string) => CatalogFilters,
    selectedValues: string[],
  ) =>
    options.filter((option) => selectedValues.includes(option.value) || hasMatchingProducts(nextFilters(option.value)));

  if (availableSubcategories.length > 0) {
    const selectedValues = filters.subcategory ?? [];
    const options = buildFacetOptions(
      availableSubcategories.map((subcategory) => ({
        value: subcategory.slug,
        label: subcategory.name,
      })),
      (value) => ({ ...filters, subcategory: [value] }),
      selectedValues,
    );

    sections.push({
      id: "subcategory",
      title: "Alt Kategoriler",
      options,
      selectedValues,
    });
  }

  if (!isSecondHandIphoneCategory) {
    const selectedValues = filters.brand ?? [];
    const options = buildFacetOptions(
      catalogOptions.brands.map((brand) => ({ value: brand, label: brand })),
      (value) => ({ ...filters, brand: [value] }),
      selectedValues,
    );

    sections.push({
      id: "brand",
      title: "Marka",
      options,
      selectedValues,
    });
  }

  if (filterProfile.showCaseDetails) {
    const selectedCaseTypes = filters.caseType ?? [];
    const selectedCaseThemes = filters.caseTheme ?? [];
    const selectedCaseFeatures = filters.caseFeature ?? [];

    if (catalogOptions.caseTypes.length > 0 || selectedCaseTypes.length > 0) {
      sections.push({
        id: "caseType",
        title: "Kılıf Tipi",
        options: buildFacetOptions(
          catalogOptions.caseTypes.map((option) => ({ value: option, label: option })),
          (value) => ({ ...filters, caseType: [value] }),
          selectedCaseTypes,
        ),
        selectedValues: selectedCaseTypes,
      });
    }

    if (catalogOptions.caseThemes.length > 0 || selectedCaseThemes.length > 0) {
      sections.push({
        id: "caseTheme",
        title: "Tema / Seri",
        options: buildFacetOptions(
          catalogOptions.caseThemes.map((option) => ({ value: option, label: option })),
          (value) => ({ ...filters, caseTheme: [value] }),
          selectedCaseThemes,
        ),
        selectedValues: selectedCaseThemes,
      });
    }

    if (catalogOptions.caseFeatures.length > 0 || selectedCaseFeatures.length > 0) {
      sections.push({
        id: "caseFeature",
        title: "Ek Özellikler",
        options: buildFacetOptions(
          catalogOptions.caseFeatures.map((option) => ({ value: option, label: option })),
          (value) => ({ ...filters, caseFeature: [value] }),
          selectedCaseFeatures,
        ),
        selectedValues: selectedCaseFeatures,
      });
    }
  }

  if (isSecondHandIphoneCategory) {
    const conditionValues = filters.secondHandCondition ?? [];
    sections.push({
      id: "condition",
      title: "Kondisyon",
      options: buildFacetOptions(
        SECOND_HAND_CONDITION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
        (value) => ({ ...filters, secondHandCondition: [value] }),
        conditionValues,
      ),
      selectedValues: conditionValues,
    });

    const batteryValues = (filters.batteryHealthMin ?? []).map(String);
    sections.push({
      id: "battery",
      title: "Pil Sağlığı",
      options: SECOND_HAND_BATTERY_BUCKETS
        .map((option) => ({
          value: `${option.value}`,
          label: option.label,
        }))
        .filter((option) => batteryValues.includes(option.value) || hasMatchingProducts({ ...filters, batteryHealthMin: [Number(option.value)] })),
      selectedValues: batteryValues,
    });

    const warrantyValues = filters.warrantyType ?? [];
    sections.push({
      id: "warranty",
      title: "Garanti",
      options: buildFacetOptions(
        SECOND_HAND_WARRANTY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
        (value) => ({ ...filters, warrantyType: [value] }),
        warrantyValues,
      ),
      selectedValues: warrantyValues,
    });

    const featureValues = [
      filters.includesBoxOnly ? "includesBoxOnly" : null,
      filters.faceIdWorkingOnly ? "faceIdWorkingOnly" : null,
      filters.trueToneWorkingOnly ? "trueToneWorkingOnly" : null,
      filters.inStockOnly ? "inStockOnly" : null,
    ].filter(Boolean) as string[];

    sections.push({
      id: "features",
      title: "Ek Özellikler",
      options: [
        { value: "includesBoxOnly", label: "Kutulu" },
        { value: "faceIdWorkingOnly", label: "Face ID OK" },
        { value: "trueToneWorkingOnly", label: "True Tone OK" },
        { value: "inStockOnly", label: "Sadece stokta olanlar" },
      ].filter((option) => {
        if (featureValues.includes(option.value)) {
          return true;
        }

        if (option.value === "includesBoxOnly") {
          return hasMatchingProducts({ ...filters, includesBoxOnly: true });
        }

        if (option.value === "faceIdWorkingOnly") {
          return hasMatchingProducts({ ...filters, faceIdWorkingOnly: true });
        }

        if (option.value === "trueToneWorkingOnly") {
          return hasMatchingProducts({ ...filters, trueToneWorkingOnly: true });
        }

        return hasMatchingProducts({ ...filters, inStockOnly: true });
      }),
      selectedValues: featureValues,
    });
  } else if (filters.inStockOnly || hasMatchingProducts({ ...filters, inStockOnly: true })) {
    sections.push({
      id: "stock",
      title: "Stok Durumu",
      options: [{ value: "inStockOnly", label: "Sadece stokta olanlar" }],
      selectedValues: filters.inStockOnly ? ["inStockOnly"] : [],
    });
  }

  if (filterProfile.showColor) {
    const selectedValues = filters.color ?? [];
    sections.push({
      id: "color",
      title: "Renk",
      options: buildFacetOptions(
        catalogOptions.colors.map((color) => ({ value: color, label: color })),
        (value) => ({ ...filters, color: [value] }),
        selectedValues,
      ),
      selectedValues,
    });
  }

  if (filterProfile.showStorage) {
    const selectedValues = filters.storage ?? [];
    sections.push({
      id: "storage",
      title: "Depolama",
      options: buildFacetOptions(
        catalogOptions.storages.map((storage) => ({ value: storage, label: storage })),
        (value) => ({ ...filters, storage: [value] }),
        selectedValues,
      ),
      selectedValues,
    });
  }

  if (filterProfile.showRam) {
    const selectedValues = filters.ram ?? [];
    sections.push({
      id: "ram",
      title: "RAM",
      options: buildFacetOptions(
        catalogOptions.ramOptions.map((ram) => ({ value: ram, label: ram })),
        (value) => ({ ...filters, ram: [value] }),
        selectedValues,
      ),
      selectedValues,
    });
  }

  for (const definition of filterProfile.attributeFilters) {
    const selectedValues = filters.attributeFilters?.[definition.id] ?? [];
    sections.push({
      id: definition.id,
      title: definition.label,
      options: buildFacetOptions(
        (catalogOptions.attributeOptions[definition.id] || []).map((option) => ({ value: option, label: option })),
        (value) => ({
          ...filters,
          attributeFilters: {
            ...(filters.attributeFilters ?? {}),
            [definition.id]: [value],
          },
        }),
        selectedValues,
      ),
      selectedValues,
    });
  }

  return sections.filter((section) => section.options.length > 0);
}
