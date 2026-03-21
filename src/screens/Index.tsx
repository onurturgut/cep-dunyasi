"use client";

import { useEffect, useState } from 'react';
import { db } from '@/integrations/mongo/client';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { ExploreCategoriesSection } from '@/components/home/ExploreCategoriesSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { HeroSection } from '@/components/home/HeroSection';
import { defaultCategories, defaultSiteContent, mergeCategories, type HomeCategory, type HomeSiteContent } from '@/components/home/home-data';

export default function Index() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<HomeCategory[]>(defaultCategories);
  const [siteContent, setSiteContent] = useState<HomeSiteContent>(defaultSiteContent);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, siteContentRes, prodRes] = await Promise.all([
        db.from('categories').select('*'),
        db.from('site_contents').select('*').eq('key', 'home').single(),
        db
          .from('products')
          .select('*, product_variants(*), categories(name, slug)')
          .eq('is_active', true)
          .limit(8),
      ]);

      if (catRes.data && catRes.data.length > 0) {
        setCategories(mergeCategories(defaultCategories, catRes.data));
      }

      if (siteContentRes.data) {
        setSiteContent({ ...defaultSiteContent, ...siteContentRes.data });
      }

      if (prodRes.data) {
        setFeaturedProducts(prodRes.data);
      }
    };

    fetchData();
  }, []);

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
      <HeroSection activeSlide={activeSlide} onSlideChange={setActiveSlide} content={siteContent} />
      <CategoriesSection categories={categories} content={siteContent} />
      <ExploreCategoriesSection categories={categories.length > 0 ? categories : defaultCategories} content={siteContent} />
      <FeaturedProductsSection featuredProducts={featuredProducts} />
    </Layout>
  );
}
