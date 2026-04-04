"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { ExploreCategoriesSection } from '@/components/home/ExploreCategoriesSection';
import { FeaturedReviewsSection } from '@/components/home/FeaturedReviewsSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { HeroSection } from '@/components/home/HeroSection';
import { SocialProofStats } from '@/components/home/SocialProofStats';
import { NewsletterInlineCard } from '@/components/newsletter/NewsletterInlineCard';
import { defaultCategories, defaultSiteContent, type HomeCategory, type HomeProduct, type HomeSiteContent } from '@/components/home/home-data';
import type { MarketingHomeModules } from '@/lib/marketing';

const PromoVideoModal = dynamic(() => import('@/components/home/PromoVideoModal').then((module) => module.PromoVideoModal), {
  ssr: false,
});

const CampaignShowcaseSection = dynamic(
  () => import('@/components/home/CampaignShowcaseSection').then((module) => module.CampaignShowcaseSection),
  {
    ssr: false,
    loading: () => <section className="py-10 md:py-14" aria-hidden="true" />,
  },
);

const RecentlyViewedSection = dynamic(
  () => import('@/components/home/RecentlyViewedSection').then((module) => module.RecentlyViewedSection),
  {
    ssr: false,
    loading: () => <section className="py-6 md:py-10" aria-hidden="true" />,
  },
);

type IndexProps = {
  initialCategories?: HomeCategory[];
  initialSiteContent?: HomeSiteContent;
  initialFeaturedProducts?: HomeProduct[];
  initialMarketing?: MarketingHomeModules | null;
};

export default function Index({
  initialCategories = defaultCategories,
  initialSiteContent = defaultSiteContent,
  initialFeaturedProducts = [],
  initialMarketing = null,
}: IndexProps) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const categories = initialCategories.length > 0 ? initialCategories : defaultCategories;
  const siteContent = initialSiteContent;
  const featuredProducts = initialFeaturedProducts;
  const marketing = initialMarketing;

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (siteContent.hero_slides.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % siteContent.hero_slides.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [siteContent.hero_slides.length]);

  if (!loading && user && isAdmin) {
    return null;
  }

  return (
    <Layout>
      <PromoVideoModal />
      <HeroSection activeSlide={activeSlide} onSlideChange={setActiveSlide} content={siteContent} />
      <CampaignShowcaseSection />
      {marketing?.socialProofItems?.length ? <SocialProofStats items={marketing.socialProofItems} /> : null}
      <CategoriesSection categories={categories} content={siteContent} />
      <ExploreCategoriesSection categories={categories} content={siteContent} />
      <FeaturedProductsSection featuredProducts={featuredProducts} content={siteContent} />
      {marketing?.featuredReviews?.length ? <FeaturedReviewsSection reviews={marketing.featuredReviews} /> : null}
      {marketing?.settings ? <NewsletterInlineCard settings={marketing.settings} /> : null}
      <RecentlyViewedSection />
    </Layout>
  );
}
