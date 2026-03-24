"use client";

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { db } from '@/integrations/mongo/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from '@/lib/product-variants';

const defaultCategories = [
  { id: 'default-telefon', name: 'Telefon', slug: 'telefon', icon: 'Smartphone' },
  { id: 'default-ikinci-el-telefon', name: '2. El Telefonlar', slug: 'ikinci-el-telefon', icon: 'Smartphone' },
  { id: 'default-akilli-saat', name: 'Akıllı Saatler', slug: 'akilli-saatler', icon: 'Watch' },
  { id: 'default-kilif', name: 'Kılıf', slug: 'kilif', icon: 'ShieldCheck' },
  { id: 'default-sarj', name: 'Şarj Aleti', slug: 'sarj-aleti', icon: 'BatteryCharging' },
  { id: 'default-power', name: 'Power Bank', slug: 'power-bank', icon: 'Battery' },
  { id: 'default-servis', name: 'Teknik Servis', slug: 'teknik-servis', icon: 'Wrench' },
];

const mergeCategories = (fallbackCategories: any[], dbCategories: any[]) => {
  const categoriesBySlug = new Map<string, any>();

  fallbackCategories.forEach((category) => {
    categoriesBySlug.set(category.slug, category);
  });

  dbCategories.forEach((category) => {
    categoriesBySlug.set(category.slug, category);
  });

  return Array.from(categoriesBySlug.values());
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activeCategory = searchParams.get('category');

  useEffect(() => {
    if (activeCategory === 'teknik-servis') {
      navigate('/technical-service', { replace: true });
    }
  }, [activeCategory, navigate]);

  useEffect(() => {
    db.from('categories').select('*').then(({ data }) => {
      if (data && data.length > 0) setCategories(mergeCategories(defaultCategories, data));
    });
  }, []);

  useEffect(() => {
    if (activeCategory === 'teknik-servis') {
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      let query = db
        .from('products')
        .select('*, product_variants(*), categories(name, slug)')
        .eq('is_active', true);

      if (activeCategory) {
        const { data: cat } = await db
          .from('categories')
          .select('id')
          .eq('slug', activeCategory)
          .single();

        if (!cat) {
          setProducts([]);
          setLoading(false);
          return;
        }

        query = query.eq('category_id', cat.id);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, [activeCategory, search]);

  if (activeCategory === 'teknik-servis') {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="w-full space-y-4 rounded-3xl border border-border/60 bg-card/55 p-4 backdrop-blur-xl sm:p-5 lg:sticky lg:top-24 lg:w-72 lg:shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">KATEGORİLER</h3>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                <Button
                  variant={!activeCategory ? 'default' : 'ghost'}
                  size="sm"
                  className="shrink-0 justify-start"
                  onClick={() => setSearchParams({})}
                >
                  Tümü
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.slug ? 'default' : 'ghost'}
                    size="sm"
                    className="shrink-0 justify-start"
                    onClick={() => {
                      if (cat.slug === 'teknik-servis') {
                        navigate('/technical-service');
                        return;
                      }

                      setSearchParams({ category: cat.slug });
                    }}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                {activeCategory
                  ? categories.find((c) => c.slug === activeCategory)?.name || 'Ürünler'
                  : 'Tüm Ürünler'}
              </h1>
              <Badge variant="secondary" className="w-fit">{products.length} ürün</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SlidersHorizontal className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-display font-semibold">Ürün bulunamadı</h3>
                <p className="mt-1 text-sm text-muted-foreground">Farklı bir arama veya kategori deneyin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {products.map((product) => {
                  const variant = getDefaultProductVariant(normalizeProductVariants(product.product_variants || []));
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      brand={product.brand}
                      description={product.description}
                      images={getVariantGallery(variant, product.images)}
                      price={variant?.price || 0}
                      variantId={variant?.id}
                      variantInfo={variant ? getVariantLabel(variant) : undefined}
                      stock={variant?.stock || 0}
                      category={product.categories?.name}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
