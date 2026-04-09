"use client";

import { Quote, ShieldCheck, Star } from "lucide-react";
import { Link } from "@/lib/router";
import type { FeaturedReviewRecord } from "@/lib/marketing";

type FeaturedReviewsSectionProps = {
  reviews: FeaturedReviewRecord[];
};

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => index < Math.round(rating));
}

export function FeaturedReviewsSection({ reviews }: FeaturedReviewsSectionProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="relative py-8 md:py-12" id="featured-reviews">
      <div className="container">
        <div className="rounded-[2rem] border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur-xl sm:p-6 md:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/70">Müşterilerimiz Ne Diyor?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Güven veren yorumlar, gerçek satın alma deneyimleri
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Onaylı ve yayındaki yorumlardan seçilen alıntılar, vitrindeki ürün kararını daha rahat vermen için burada.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {reviews.slice(0, 6).map((review) => (
              <article
                key={review.id}
                className="rounded-[1.6rem] border border-border/70 bg-background/80 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {renderStars(review.rating).map((filled, starIndex) => (
                      <Star
                        key={`${review.id}-star-${starIndex}`}
                        className={`h-4 w-4 ${filled ? "fill-current" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <Quote className="h-4 w-4 text-muted-foreground/70" />
                </div>

                {review.title ? <h3 className="mt-4 text-base font-semibold text-foreground">{review.title}</h3> : null}
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{review.comment}</p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.authorName}</p>
                    {review.productName && review.productSlug ? (
                      <Link to={`/product/${review.productSlug}`} className="text-xs text-primary transition-opacity hover:opacity-80">
                        {review.productName}
                      </Link>
                    ) : null}
                  </div>
                  {review.isVerifiedPurchase ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Doğrulanmış
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

