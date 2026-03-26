"use client";

import { RefObject, useEffect, useState } from "react";

export function useStickyBuyBarVisibility(targetRef: RefObject<HTMLElement | null>, enabled = true) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setVisible(false);
      return;
    }

    const target = targetRef.current;

    if (!target) {
      setVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -72px 0px",
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, targetRef]);

  return visible;
}
