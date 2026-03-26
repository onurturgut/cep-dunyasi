"use client";

import { Skeleton } from "@/components/ui/skeleton";

type AccountSectionSkeletonProps = {
  cards?: number;
  rows?: number;
};

export function AccountSectionSkeleton({ cards = 1, rows = 3 }: AccountSectionSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cards }).map((_, cardIndex) => (
        <div key={cardIndex} className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
          <Skeleton className="h-6 w-40 rounded-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: rows }).map((__, rowIndex) => (
              <Skeleton key={rowIndex} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
