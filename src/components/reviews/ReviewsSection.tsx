"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMarkReviewHelpful, useProductReviews } from "@/hooks/use-reviews";
import { useI18n } from "@/i18n/provider";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import type { ReviewSort } from "@/lib/reviews";

type ReviewsSectionProps = {
  productId: string;
  productName: string;
  brand?: string | null;
  description?: string | null;
  images?: string[];
  price?: number | null;
  compareAtPrice?: number | null;
  sku?: string | null;
  url?: string | null;
  availability?: "https://schema.org/InStock" | "https://schema.org/OutOfStock" | "https://schema.org/PreOrder";
  currency?: string;
  embedded?: boolean;
};

function buildReviewStructuredData(props: {
  productName: string;
  brand?: string | null;
  description?: string | null;
  images?: string[];
  price?: number | null;
  compareAtPrice?: number | null;
  sku?: string | null;
  url?: string | null;
  availability?: "https://schema.org/InStock" | "https://schema.org/OutOfStock" | "https://schema.org/PreOrder";
  currency?: string;
  average: number;
  count: number;
  reviews: Array<{
    author_name: string;
    rating: number;
    title: string | null;
    comment: string;
    created_at: string;
  }>;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.productName,
  };

  if (props.brand) {
    data.brand = {
      "@type": "Brand",
      name: props.brand,
    };
  }

  if (props.description) {
    data.description = props.description;
  }

  if (props.images && props.images.length > 0) {
    data.image = props.images.slice(0, 5);
  }

  if (props.sku) {
    data.sku = props.sku;
  }

  if (props.price && props.price > 0) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: props.currency || "TRo",
      price: props.price.toFixed(2),
      availability: props.availability || "https://schema.org/InStock",
      url: props.url || undefined,
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: undefined,
      ...(props.compareAtPrice && props.compareAtPrice > props.price
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceCurrency: props.currency || "TRo",
              price: props.price.toFixed(2),
              referenceQuantity: {
                "@type": "QuantitativeValue",
                value: 1,
              },
            },
          }
        : {}),
    };
  }

  if (props.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: props.average.toFixed(1),
      reviewCount: props.count,
      bestRating: 5,
      worstRating: 1,
    };

    data.review = props.reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author_name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      headline: review.title || undefined,
      reviewBody: review.comment,
      datePublished: review.created_at,
    }));
  }

  return data;
}

export function ReviewsSection({
  productId,
  productName,
  brand,
  description,
  images = [],
  price,
  compareAtPrice,
  sku,
  url,
  availability,
  currency = "TRo",
  embedded = false,
}: ReviewsSectionProps) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const helpfulMutation = useMarkReviewHelpful();

  const copy =
    locale === "en"
      ? {
          helpfulError: "Helpful vote could not be saved",
          signInRequired: "oou need to sign in to leave a review.",
          page: (current: number, total: number) => `Page ${current} / ${total}`,
          previous: "Previous",
          next: "Next",
        }
      : {
          helpfulError: "Faydalı oyu kaydedilemedi",
          signInRequired: "Yorum bırakmak için hesabınıza giriş yapmanız gerekiyor.",
          page: (current: number, total: number) => `Sayfa ${current} / ${total}`,
          previous: "Önceki",
          next: "Sonraki",
        };

  const { data, isLoading, isFetching } = useProductReviews(productId, {
    page,
    limit: 10,
    rating,
    verified,
    sort,
  });

  const structuredData = useMemo(
    () =>
      buildReviewStructuredData({
        productName,
        brand,
        description,
        images,
        price,
        compareAtPrice,
        sku,
        url,
        availability,
        currency,
        average: data?.summary.average ?? 0,
        count: data?.summary.count ?? 0,
        reviews: (data?.items ?? []).map((review) => ({
          author_name: review.author_name,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          created_at: review.created_at,
        })),
      }),
    [availability, brand, compareAtPrice, currency, data?.items, data?.summary.average, data?.summary.count, description, images, price, productName, sku, url],
  );

  const handleHelpful = async (reviewId: string) => {
    try {
      await helpfulMutation.mutateAsync({ reviewId, productId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.helpfulError);
    }
  };

  return (
    <section className={embedded ? "space-y-6" : "mt-10 border-t border-border/50 pt-8"} id="reviews">
      <Script id={`product-reviews-schema-${productId}`} type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(structuredData)}
      </Script>

      <div className="space-y-6">
        <ReviewSummary
          summary={
            data?.summary ?? {
              average: 0,
              count: 0,
              distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
              verified_purchase_count: 0,
              verified_purchase_ratio: 0,
            }
          }
        />

        {user ? (
          <ReviewForm
            productId={productId}
            viewerReviewStatus={data?.viewerReviewStatus ?? null}
            canReview={data?.viewerCanReview ?? false}
            reviewReason={data?.viewerReviewReason ?? "not_purchased"}
          />
        ) : (
          <Card className="border-border/70">
            <CardContent className="p-5 text-sm text-muted-foreground">{copy.signInRequired}</CardContent>
          </Card>
        )}

        <ReviewFilters
          value={{ rating, verified, sort }}
          onChange={(next) => {
            setPage(1);
            setRating(next.rating);
            setVerified(next.verified);
            setSort(next.sort);
          }}
        />

        <ReviewList
          items={data?.items ?? []}
          loading={isLoading || isFetching}
          onHelpful={handleHelpful}
          helpfulReviewId={helpfulMutation.variables?.reviewId ?? null}
          canMarkHelpful={Boolean(user)}
          currentUserId={user?.id ?? null}
        />

        {(data?.totalPages ?? 1) > 1 ? (
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">{copy.page(data?.page ?? 1, data?.totalPages ?? 1)}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={(data?.page ?? 1) <= 1}>
                {copy.previous}
              </Button>
              <Button variant="outline" onClick={() => setPage((current) => Math.min(data?.totalPages ?? current, current + 1))} disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1)}>
                {copy.next}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

