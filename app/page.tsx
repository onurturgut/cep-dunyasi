import { defaultCategories, defaultSiteContent } from "@/components/home/home-data";
import IndexScreen from "@/screens/Index";
import { getHomePageData } from "@/server/services/home-page";

export const revalidate = 300;

export default async function HomePage() {
  try {
    const data = await getHomePageData();

    return (
      <IndexScreen
        initialCategories={data.categories}
        initialSiteContent={data.siteContent}
        initialFeaturedProducts={data.featuredProducts}
      />
    );
  } catch (error) {
    console.error("HomePage server data load failed:", error);

    return (
      <IndexScreen
        initialCategories={defaultCategories}
        initialSiteContent={defaultSiteContent}
        initialFeaturedProducts={[]}
      />
    );
  }
}
