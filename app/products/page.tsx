import { Suspense } from "react";
import { defaultCategories } from "@/components/home/home-data";
import ProductsScreen from "@/screens/Products";
import { getTopLevelCategories } from "@/server/services/home-page";

export const revalidate = 900;

export default async function ProductsPage() {
  let initialCategories = defaultCategories;

  try {
    initialCategories = await getTopLevelCategories();
  } catch (error) {
    console.error("ProductsPage category preload failed:", error);
  }

  return (
    <Suspense fallback={null}>
      <ProductsScreen initialCategories={initialCategories} />
    </Suspense>
  );
}
