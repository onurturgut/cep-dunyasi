import ProductDetailScreen from "@/screens/ProductDetail";
import { connectToDatabase } from "@/server/mongodb";
import { getProductDetailBySlug } from "@/server/services/product-detail";

export const revalidate = 300;

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  let initialProduct = null;

  try {
    await connectToDatabase();
    initialProduct = await getProductDetailBySlug(slug);
  } catch (error) {
    console.error("ProductDetailPage preload failed:", error);
  }

  return (
    <ProductDetailScreen slug={slug} initialProduct={initialProduct} />
  );
}
